import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import AWS from "aws-sdk";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import { Book, User, IBook } from "../models";
import { createBookSchema, updateBookSchema, paginationQuerySchema } from "../validation/writerValidation";
import { ZodError } from "zod";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

type ValidationIssue = {
  field: string;
  message: string;
};

type ValidationErrorResponse = {
  message: string;
  errors: ValidationIssue[];
  status: number;
};

type ErrorResponse = {
  message: string;
  status: number;
};

const formatValidationError = (error: ZodError): ValidationErrorResponse => ({
  message: "Validation error",
  status: StatusCodes.BAD_REQUEST,
  errors: error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  })),
});

const sendErrorResponse = (res: Response, error: ErrorResponse): void => {
  res.status(error.status).json(error);
};

const isValidObjectId = (value: string): boolean => mongoose.Types.ObjectId.isValid(value);

export class BookController {
  // POST /api/books - Create new book (draft or published)
  async createBook(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = createBookSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const validatedData = parseResult.data;
    const userId = req.user.userId;

    try {
      // Generate slug from title
      const baseSlug = slugify(validatedData.title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await Book.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Determine isDraft and visibility
      const isDraft = validatedData.isDraft !== undefined 
        ? validatedData.isDraft 
        : validatedData.status === "draft" || true;
      const visibility = validatedData.visibility ?? (isDraft ? "private" : "public");

      const book = new Book({
        authorId: userId,
        title: validatedData.title,
        slug,
        description: validatedData.description || "",
        priceCents: validatedData.priceCents ?? validatedData.price ?? 0,
        currency: validatedData.currency ?? "USD",
        isDraft,
        visibility,
        tags: validatedData.tags || [],
        coverUrl: validatedData.coverUrl || validatedData.coverImage,
        // Legacy fields
        category: validatedData.category,
        status: isDraft ? "draft" : "published",
        genres: validatedData.genres,
        language: validatedData.language,
        pages: validatedData.pages,
      });

      await book.save();

      res.status(StatusCodes.CREATED).json(book);
    } catch (error: unknown) {
      console.error("[BOOK] Create book error:", error);
      sendErrorResponse(res, {
        message: "Failed to create book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // GET /api/books - List published books with filters
  async listBooks(req: Request, res: Response): Promise<void> {
    try {
      const { q, tag, author, sort = "newest", limit = "20", offset = "0" } = req.query;

      const query: Record<string, unknown> = {
        isDraft: false,
        visibility: "public",
      };

      // Text search
      if (q && typeof q === "string") {
        query.$text = { $search: q };
      }

      // Filter by tag
      if (tag && typeof tag === "string") {
        query.tags = tag;
      }

      // Filter by author username
      if (author && typeof author === "string") {
        const user = await User.findOne({ username: author });
        if (user) {
          query.authorId = user._id;
        }
      }

      // Sort options
      let sortBy: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort === "popular") sortBy = { "stats.sales": -1 };
      if (sort === "views") sortBy = { "stats.views": -1 };
      if (sort === "price-low") sortBy = { priceCents: 1 };
      if (sort === "price-high") sortBy = { priceCents: -1 };

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const [books, total] = await Promise.all([
        Book.find(query)
          .sort(sortBy)
          .limit(limitNum)
          .skip(offsetNum)
          .populate("authorId", "username profile.name avatar"),
        Book.countDocuments(query),
      ]);

      res.json({
        data: books,
        total,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      console.error("[BOOK] List books error:", error);
      sendErrorResponse(res, {
        message: "Failed to list books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // GET /api/books/:slug - Book detail
  async getBook(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const book = await Book.findOne({ slug }).populate("authorId", "username profile bio avatar");

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      // Check authorization if draft
      if (book.isDraft) {
        const userId = req.user?.userId;
        if (!userId || userId !== book.authorId._id.toString()) {
          sendErrorResponse(res, {
            message: "Not authorized to view this book",
            status: StatusCodes.FORBIDDEN,
          });
          return;
        }
      }

      // Increment view count (async, don't wait)
      Book.updateOne({ _id: book._id }, { $inc: { "stats.views": 1 } }).exec();

      res.json(book);
    } catch (error) {
      console.error("[BOOK] Get book error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // PUT /api/books/:id - Update book
  async updateBook(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const parseResult = updateBookSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const validatedData = parseResult.data;
    const userId = req.user.userId;

    try {
      const book = await Book.findById(id);

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.authorId.toString() !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized to update this book",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      // Handle title change (regenerate slug)
      if (validatedData.title && validatedData.title !== book.title) {
        const baseSlug = slugify(validatedData.title, { lower: true, strict: true });
        let newSlug = baseSlug;
        let counter = 1;

        while (await Book.findOne({ slug: newSlug, _id: { $ne: id } })) {
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        book.slug = newSlug;
        book.title = validatedData.title;
      }

      // Update other fields
      if (validatedData.description !== undefined) book.description = validatedData.description;
      if (validatedData.priceCents !== undefined) book.priceCents = validatedData.priceCents;
      if (validatedData.currency) book.currency = validatedData.currency;
      if (validatedData.tags) book.tags = validatedData.tags;
      if (validatedData.isDraft !== undefined) book.isDraft = validatedData.isDraft;
      if (validatedData.visibility) book.visibility = validatedData.visibility;
      if (validatedData.coverUrl) book.coverUrl = validatedData.coverUrl;

      // Legacy fields
      if (validatedData.category) book.category = validatedData.category;
      if (validatedData.price !== undefined) book.priceCents = validatedData.price * 100;
      if (validatedData.coverImage) book.coverUrl = validatedData.coverImage;
      if (validatedData.status) book.status = validatedData.status;
      if (validatedData.genres) book.genres = validatedData.genres;
      if (validatedData.language) book.language = validatedData.language;
      if (validatedData.pages) book.pages = validatedData.pages;

      await book.save();

      res.json(book);
    } catch (error) {
      console.error("[BOOK] Update book error:", error);
      sendErrorResponse(res, {
        message: "Failed to update book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // DELETE /api/books/:id - Delete book
  async deleteBook(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const book = await Book.findById(id);

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.authorId.toString() !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized to delete this book",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      // Delete files from S3
      const bucket = process.env.AWS_S3_BUCKET;
      if (bucket) {
        for (const file of book.files) {
          const key = `books/${book._id}/${file._id}`;
          try {
            await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
          } catch (error) {
            console.error(`[BOOK] Failed to delete file ${key}:`, error);
          }
        }
      }

      await Book.deleteOne({ _id: book._id });

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      console.error("[BOOK] Delete book error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // POST /api/books/:id/file-upload-url - Get presigned URL for file upload
  async getFileUploadUrl(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;
    const { filename, fileType } = req.body;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    if (!filename || !fileType) {
      sendErrorResponse(res, {
        message: "Filename and fileType are required",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const book = await Book.findById(id);

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.authorId.toString() !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const bucket = process.env.AWS_S3_BUCKET;
      if (!bucket) {
        sendErrorResponse(res, {
          message: "S3 not configured",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      const fileId = uuid();
      const key = `books/${id}/${fileId}`;

      const presignedUrl = s3.getSignedUrl("putObject", {
        Bucket: bucket,
        Key: key,
        ContentType: fileType || "application/octet-stream",
        Expires: 3600, // 1 hour
      });

      res.json({ presignedUrl, fileId, key });
    } catch (error) {
      console.error("[BOOK] Get file upload URL error:", error);
      sendErrorResponse(res, {
        message: "Failed to generate upload URL",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // PUT /api/books/:id/files - Add file metadata after upload
  async addFile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;
    const { fileId, type, size } = req.body;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    if (!fileId || !type || !size) {
      sendErrorResponse(res, {
        message: "fileId, type, and size are required",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const book = await Book.findById(id);

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.authorId.toString() !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const bucket = process.env.AWS_S3_BUCKET;
      const url = bucket
        ? `https://${bucket}.s3.amazonaws.com/books/${id}/${fileId}`
        : `/uploads/books/${id}/${fileId}`;

      book.files.push({
        _id: fileId,
        type,
        url,
        size,
        uploadedAt: new Date(),
      });

      await book.save();

      res.json({ message: "File added", file: book.files[book.files.length - 1] });
    } catch (error) {
      console.error("[BOOK] Add file error:", error);
      sendErrorResponse(res, {
        message: "Failed to add file",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // DELETE /api/books/:id/files/:fileId - Remove file
  async deleteFile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { id, fileId } = req.params;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const book = await Book.findById(id);

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.authorId.toString() !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const file = book.files.find((f) => f._id === fileId);
      if (!file) {
        sendErrorResponse(res, {
          message: "File not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      // Delete from S3
      const bucket = process.env.AWS_S3_BUCKET;
      if (bucket) {
        const key = `books/${id}/${fileId}`;
        try {
          await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
        } catch (error) {
          console.error(`[BOOK] Failed to delete file ${key}:`, error);
        }
      }

      book.files = book.files.filter((f) => f._id !== fileId);
      await book.save();

      res.json({ message: "File deleted" });
    } catch (error) {
      console.error("[BOOK] Delete file error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete file",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // GET /api/users/:username/books - Author's published books
  async getAuthorBooks(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const { limit = "20", offset = "0" } = req.query;

      const user = await User.findOne({ username });
      if (!user) {
        sendErrorResponse(res, {
          message: "Author not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const [books, total] = await Promise.all([
        Book.find({
          authorId: user._id,
          isDraft: false,
          visibility: "public",
        })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip(offsetNum),
        Book.countDocuments({
          authorId: user._id,
          isDraft: false,
          visibility: "public",
        }),
      ]);

      res.json({ data: books, total });
    } catch (error) {
      console.error("[BOOK] Get author books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch author books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // GET /api/users/me/books - Authenticated user's books (draft + published)
  async getMyBooks(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const { limit = "20", offset = "0" } = req.query;

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const [books, total] = await Promise.all([
        Book.find({ authorId: userId })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip(offsetNum),
        Book.countDocuments({ authorId: userId }),
      ]);

      res.json({ data: books, total });
    } catch (error) {
      console.error("[BOOK] Get my books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch your books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

export const bookController = new BookController();
