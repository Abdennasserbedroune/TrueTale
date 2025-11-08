import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { FeedService } from "../utils/feedService";
import {
  Book,
  Draft,
  Story,
  User,
  IBook,
  IDraft,
  IStory,
  IUser,
} from "../models";
import {
  createBookSchema,
  updateBookSchema,
  createDraftSchema,
  updateDraftSchema,
  createStorySchema,
  updateProfileSchema,
  paginationQuerySchema,
} from "../validation/writerValidation";

const { Types } = mongoose;

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
  errors: error.errors.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  })),
});

const serializeBook = (book: IBook) => ({
  id: book._id.toString(),
  title: book.title,
  description: book.description,
  category: book.category,
  price: book.price,
  coverImage: book.coverImage,
  status: book.status,
  genres: book.genres,
  language: book.language,
  pages: book.pages,
  averageRating: book.averageRating,
  reviewCount: book.reviewCount,
  publishedAt: book.publishedAt,
  writerId: book.writerId.toString(),
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
});

const serializeDraft = (draft: IDraft) => ({
  id: draft._id.toString(),
  title: draft.title,
  content: draft.content,
  wordCount: draft.wordCount,
  writerId: draft.writerId.toString(),
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
});

const serializeStory = (story: IStory) => ({
  id: story._id.toString(),
  title: story.title,
  content: story.content,
  published: story.published,
  writerId: story.writerId.toString(),
  createdAt: story.createdAt,
  updatedAt: story.updatedAt,
});

const serializeProfile = (user: IUser) => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  profile: user.profile,
  bio: user.bio,
  avatar: user.avatar,
  socials: user.socials,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sendErrorResponse = (res: Response, error: ErrorResponse): void => {
  res.status(error.status).json(error);
};

const isValidObjectId = (value: string): boolean => Types.ObjectId.isValid(value);

export function createWriterController(feedService: FeedService) {
  const createBook = async (req: Request, res: Response): Promise<void> => {
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

    const userId = req.user.userId;
    const writerId = new Types.ObjectId(userId);
    const validatedData = parseResult.data;
    const session = await mongoose.startSession();

    try {
      let createdBook: IBook | null = null;

      await session.withTransaction(async () => {
        const book = new Book({
          ...validatedData,
          status: validatedData.status ?? "draft",
          writerId,
        });

        createdBook = await book.save({ session });

        if (createdBook.status === "published") {
          await feedService.record(
            "book_published",
            {
              userId,
              targetId: createdBook._id.toString(),
              metadata: {
                title: createdBook.title,
              },
            },
            session
          );
        }
      });

      if (!createdBook) {
        sendErrorResponse(res, {
          message: "Failed to create book",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      res.status(StatusCodes.CREATED).json({ book: serializeBook(createdBook) });
    } catch (error) {
      console.error("[WRITER] Create book error:", error);
      sendErrorResponse(res, {
        message: "Failed to create book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await session.endSession();
    }
  };

  const updateBook = async (req: Request, res: Response): Promise<void> => {
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

    const session = await mongoose.startSession();
    const userId = req.user.userId;
    const writerId = new Types.ObjectId(userId);
    const validatedData = parseResult.data;

    try {
      let updatedBook: IBook | null = null;
      let errorResponse: ErrorResponse | null = null;

      await session.withTransaction(async () => {
        const book = await Book.findById(id).session(session);

        if (!book) {
          errorResponse = {
            message: "Book not found",
            status: StatusCodes.NOT_FOUND,
          };
          return;
        }

        if (!book.writerId.equals(writerId)) {
          errorResponse = {
            message: "You do not have access to this resource",
            status: StatusCodes.FORBIDDEN,
          };
          return;
        }

        const previousStatus = book.status;

        Object.entries(validatedData).forEach(([key, value]) => {
          if (typeof value === "undefined") {
            return;
          }
          (book as unknown as Record<string, unknown>)[key] = value;
        });

        updatedBook = await book.save({ session });

        if (
          previousStatus !== "published" &&
          updatedBook.status === "published"
        ) {
          await feedService.record(
            "book_published",
            {
              userId,
              targetId: updatedBook._id.toString(),
              metadata: {
                title: updatedBook.title,
              },
            },
            session
          );
        }
      });

      if (errorResponse) {
        sendErrorResponse(res, errorResponse);
        return;
      }

      if (!updatedBook) {
        sendErrorResponse(res, {
          message: "Failed to update book",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      res.status(StatusCodes.OK).json({ book: serializeBook(updatedBook) });
    } catch (error) {
      console.error("[WRITER] Update book error:", error);
      sendErrorResponse(res, {
        message: "Failed to update book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await session.endSession();
    }
  };

  const deleteBook = async (req: Request, res: Response): Promise<void> => {
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

    const session = await mongoose.startSession();
    const writerId = new Types.ObjectId(req.user.userId);

    try {
      let errorResponse: ErrorResponse | null = null;
      let deleted = false;

      await session.withTransaction(async () => {
        const book = await Book.findById(id).session(session);

        if (!book) {
          errorResponse = {
            message: "Book not found",
            status: StatusCodes.NOT_FOUND,
          };
          return;
        }

        if (!book.writerId.equals(writerId)) {
          errorResponse = {
            message: "You do not have access to this resource",
            status: StatusCodes.FORBIDDEN,
          };
          return;
        }

        await book.deleteOne({ session });
        deleted = true;
      });

      if (errorResponse) {
        sendErrorResponse(res, errorResponse);
        return;
      }

      if (!deleted) {
        sendErrorResponse(res, {
          message: "Failed to delete book",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      console.error("[WRITER] Delete book error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await session.endSession();
    }
  };

  const getBooks = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = paginationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { page, limit } = parseResult.data;
    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const [books, total] = await Promise.all([
        Book.find({ writerId, status: "published" })
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Book.countDocuments({ writerId, status: "published" }),
      ]);

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(StatusCodes.OK).json({
        data: books.map(serializeBook),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("[WRITER] List books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getDrafts = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = paginationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { page, limit } = parseResult.data;
    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const [drafts, total] = await Promise.all([
        Draft.find({ writerId })
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Draft.countDocuments({ writerId }),
      ]);

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(StatusCodes.OK).json({
        data: drafts.map(serializeDraft),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("[WRITER] List drafts error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch drafts",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const createDraft = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = createDraftSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const draft = await Draft.create({
        ...parseResult.data,
        writerId,
      });

      res.status(StatusCodes.CREATED).json({ draft: serializeDraft(draft) });
    } catch (error) {
      console.error("[WRITER] Create draft error:", error);
      sendErrorResponse(res, {
        message: "Failed to create draft",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const updateDraft = async (req: Request, res: Response): Promise<void> => {
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
        message: "Invalid draft id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const parseResult = updateDraftSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    try {
      const draft = await Draft.findById(id);

      if (!draft) {
        sendErrorResponse(res, {
          message: "Draft not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const ownerId = req.user.userId;

      if (draft.writerId.toString() !== ownerId) {
        sendErrorResponse(res, {
          message: "You do not have access to this resource",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      Object.entries(parseResult.data).forEach(([key, value]) => {
        if (typeof value === "undefined") {
          return;
        }
        (draft as unknown as Record<string, unknown>)[key] = value;
      });

      await draft.save();

      res.status(StatusCodes.OK).json({ draft: serializeDraft(draft) });
    } catch (error) {
      console.error("[WRITER] Update draft error:", error);
      sendErrorResponse(res, {
        message: "Failed to update draft",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const deleteDraft = async (req: Request, res: Response): Promise<void> => {
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
        message: "Invalid draft id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const draft = await Draft.findById(id);

      if (!draft) {
        sendErrorResponse(res, {
          message: "Draft not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (draft.writerId.toString() !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this resource",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      await draft.deleteOne();

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      console.error("[WRITER] Delete draft error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete draft",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getStories = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = paginationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { page, limit } = parseResult.data;
    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const [stories, total] = await Promise.all([
        Story.find({ writerId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Story.countDocuments({ writerId }),
      ]);

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(StatusCodes.OK).json({
        data: stories.map(serializeStory),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("[WRITER] List stories error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch stories",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const createStory = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = createStorySchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const userId = req.user.userId;
    const writerId = new Types.ObjectId(userId);
    const session = await mongoose.startSession();

    try {
      let createdStory: IStory | null = null;

      await session.withTransaction(async () => {
        const story = new Story({
          ...parseResult.data,
          published: parseResult.data.published ?? true,
          writerId,
        });

        createdStory = await story.save({ session });

        if (createdStory.published) {
          await feedService.record(
            "story_published",
            {
              userId,
              targetId: createdStory._id.toString(),
              metadata: {
                title: createdStory.title,
              },
            },
            session
          );
        }
      });

      if (!createdStory) {
        sendErrorResponse(res, {
          message: "Failed to create story",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      res.status(StatusCodes.CREATED).json({ story: serializeStory(createdStory) });
    } catch (error) {
      console.error("[WRITER] Create story error:", error);
      sendErrorResponse(res, {
        message: "Failed to create story",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await session.endSession();
    }
  };

  const deleteStory = async (req: Request, res: Response): Promise<void> => {
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
        message: "Invalid story id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const story = await Story.findById(id);

      if (!story) {
        sendErrorResponse(res, {
          message: "Story not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (story.writerId.toString() !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this resource",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      await story.deleteOne();

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      console.error("[WRITER] Delete story error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete story",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const user = await User.findById(writerId);

      if (!user) {
        sendErrorResponse(res, {
          message: "Writer profile not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const [totalBooks, publishedBooks, totalDrafts, totalStories] = await Promise.all([
        Book.countDocuments({ writerId }),
        Book.countDocuments({ writerId, status: "published" }),
        Draft.countDocuments({ writerId }),
        Story.countDocuments({ writerId }),
      ]);

      res.status(StatusCodes.OK).json({
        profile: serializeProfile(user),
        stats: {
          books: {
            total: totalBooks,
            published: publishedBooks,
          },
          drafts: totalDrafts,
          stories: totalStories,
        },
      });
    } catch (error) {
      console.error("[WRITER] Get profile error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch profile",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const writerId = new Types.ObjectId(req.user.userId);

    try {
      const user = await User.findById(writerId);

      if (!user) {
        sendErrorResponse(res, {
          message: "Writer profile not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const updates = parseResult.data;

      if (Object.prototype.hasOwnProperty.call(updates, "profile")) {
        user.profile = updates.profile;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
        user.bio = updates.bio;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "avatar")) {
        user.avatar = updates.avatar;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "socials")) {
        user.socials = updates.socials;
      }

      await user.save();

      res.status(StatusCodes.OK).json({ profile: serializeProfile(user) });
    } catch (error) {
      console.error("[WRITER] Update profile error:", error);
      sendErrorResponse(res, {
        message: "Failed to update profile",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  return {
    createBook,
    updateBook,
    deleteBook,
    getBooks,
    getDrafts,
    createDraft,
    updateDraft,
    deleteDraft,
    getStories,
    createStory,
    deleteStory,
    getProfile,
    updateProfile,
  };
}
