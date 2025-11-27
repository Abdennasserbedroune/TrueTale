import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AWS from "aws-sdk";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import { db } from "@truetale/db";
import { createBookSchema, updateBookSchema } from "../validation/writerValidation";
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
      while (true) {
        const { data: existing } = await db.from("books").select("id").eq("slug", slug).maybeSingle();
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Determine isDraft and visibility
      const isDraft = validatedData.isDraft !== undefined
        ? validatedData.isDraft
        : validatedData.status === "draft" || true;
      const visibility = validatedData.visibility ?? (isDraft ? "private" : "public");

      const { data: book, error } = await db
        .from("books")
        .insert({
          writer_id: userId,
          title: validatedData.title,
          slug,
          description: validatedData.description || "",
          price_cents: validatedData.priceCents ?? validatedData.price ?? 0,
          currency: validatedData.currency ?? "USD",
          is_draft: isDraft,
          visibility,
          tags: validatedData.tags || [],
          cover_url: validatedData.coverUrl || validatedData.coverImage,
          status: isDraft ? "draft" : "published",
          genres: validatedData.genres,
          language: validatedData.language,
          pages: validatedData.pages,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

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

      let query = db.from("books").select("*, writer:users(username, profile, avatar)", { count: "exact" })
        .eq("is_draft", false)
        .eq("visibility", "public");

      // Text search (simple implementation, for full text search use Supabase text search features)
      if (q && typeof q === "string") {
        query = query.ilike("title", `%${q}%`);
      }

      // Filter by tag
      if (tag && typeof tag === "string") {
        query = query.contains("tags", [tag]);
      }

      // Filter by author username
      if (author && typeof author === "string") {
        const { data: user } = await db.from("users").select("id").eq("username", author).single();
        if (user) {
          query = query.eq("writer_id", user.id);
        }
      }

      // Sort options
      if (sort === "popular") query = query.order("stats->sales", { ascending: false }); // Assuming stats is JSONB
      else if (sort === "views") query = query.order("stats->views", { ascending: false });
      else if (sort === "price-low") query = query.order("price_cents", { ascending: true });
      else if (sort === "price-high") query = query.order("price_cents", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const { data: books, count, error } = await query.range(offsetNum, offsetNum + limitNum - 1);

      if (error) throw error;

      res.json({
        data: books,
        total: count,
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
      const { data: book, error } = await db
        .from("books")
        .select("*, writer:users(username, profile, bio, avatar)")
        .eq("slug", slug)
        .single();

      if (error || !book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      // Check authorization if draft
      if (book.is_draft) {
        const userId = req.user?.userId;
        // @ts-ignore - writer is joined
        if (!userId || userId !== book.writer_id) {
          sendErrorResponse(res, {
            message: "Not authorized to view this book",
            status: StatusCodes.FORBIDDEN,
          });
          return;
        }
      }

      // Increment view count (async, don't wait)
      // Note: This requires a stored procedure or just simple update if concurrency isn't huge issue
      // For now, simple update
      // db.rpc('increment_book_views', { book_id: book.id }); 

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

    const parseResult = updateBookSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const validatedData = parseResult.data;
    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("*").eq("id", id).single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized to update this book",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const updateData: any = {};

      // Handle title change (regenerate slug)
      if (validatedData.title && validatedData.title !== book.title) {
        const baseSlug = slugify(validatedData.title, { lower: true, strict: true });
        let newSlug = baseSlug;
        let counter = 1;

        while (true) {
          const { data: existing } = await db.from("books").select("id").eq("slug", newSlug).neq("id", id).maybeSingle();
          if (!existing) break;
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        updateData.slug = newSlug;
        updateData.title = validatedData.title;
      }

      // Update other fields
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.priceCents !== undefined) updateData.price_cents = validatedData.priceCents;
      if (validatedData.currency) updateData.currency = validatedData.currency;
      if (validatedData.tags) updateData.tags = validatedData.tags;
      if (validatedData.isDraft !== undefined) updateData.is_draft = validatedData.isDraft;
      if (validatedData.visibility) updateData.visibility = validatedData.visibility;
      if (validatedData.coverUrl) updateData.cover_url = validatedData.coverUrl;

      // Legacy fields
      if (validatedData.category) updateData.category = validatedData.category;
      if (validatedData.price !== undefined) updateData.price_cents = validatedData.price * 100;
      if (validatedData.coverImage) updateData.cover_url = validatedData.coverImage;
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.genres) updateData.genres = validatedData.genres;
      if (validatedData.language) updateData.language = validatedData.language;
      if (validatedData.pages) updateData.pages = validatedData.pages;

      updateData.updated_at = new Date().toISOString();

      const { data: updatedBook, error } = await db
        .from("books")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      res.json(updatedBook);
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
    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("*").eq("id", id).single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized to delete this book",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      // Delete files from S3
      const bucket = process.env.AWS_S3_BUCKET;
      if (bucket && book.files) {
        // Assuming files is a JSONB array of objects with _id
        for (const file of book.files as any[]) {
          const key = `books/${book.id}/${file._id}`;
          try {
            await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
          } catch (error) {
            console.error(`[BOOK] Failed to delete file ${key}:`, error);
          }
        }
      }

      const { error } = await db.from("books").delete().eq("id", id);
      if (error) throw error;

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

    if (!filename || !fileType) {
      sendErrorResponse(res, {
        message: "Filename and fileType are required",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("writer_id").eq("id", id).single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id !== userId) {
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

    if (!fileId || !type || !size) {
      sendErrorResponse(res, {
        message: "fileId, type, and size are required",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("*").eq("id", id).single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id !== userId) {
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

      const newFile = {
        _id: fileId,
        type,
        url,
        size,
        uploadedAt: new Date().toISOString(),
      };

      const files = (book.files as any[]) || [];
      files.push(newFile);

      const { error } = await db
        .from("books")
        .update({ files })
        .eq("id", id);

      if (error) throw error;

      res.json({ message: "File added", file: newFile });
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
    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("*").eq("id", id).single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id !== userId) {
        sendErrorResponse(res, {
          message: "Not authorized",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const files = (book.files as any[]) || [];
      const file = files.find((f) => f._id === fileId);

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

      const updatedFiles = files.filter((f) => f._id !== fileId);

      const { error } = await db
        .from("books")
        .update({ files: updatedFiles })
        .eq("id", id);

      if (error) throw error;

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

      const { data: user } = await db.from("users").select("id").eq("username", username).single();
      if (!user) {
        sendErrorResponse(res, {
          message: "Author not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const { data: books, count, error } = await db
        .from("books")
        .select("*", { count: "exact" })
        .eq("writer_id", user.id)
        .eq("is_draft", false)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (error) throw error;

      res.json({ data: books, total: count });
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

      const { data: books, count, error } = await db
        .from("books")
        .select("*", { count: "exact" })
        .eq("writer_id", userId)
        .order("created_at", { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (error) throw error;

      res.json({ data: books, total: count });
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
