import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { Book, Follow, IBook, IUser, User } from "../models";
import { marketplaceCache } from "../utils/marketplaceCache";
import {
  marketplacePaginationSchema,
  marketplaceSearchSchema,
  marketplaceFilterSchema,
  marketplaceTrendingSchema,
} from "../validation/marketplaceValidation";

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

type WriterSummary = {
  id: string;
  username: string;
  profile?: string | null;
  bio?: string | null;
  avatar?: string | null;
  followersCount: number;
  publishedBooks?: number;
};

type PaginatedResponse<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
};

const formatValidationError = (error: ZodError): ValidationErrorResponse => ({
  message: "Validation error",
  status: StatusCodes.BAD_REQUEST,
  errors: error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  })),
});

const sendErrorResponse = (res: Response, error: ErrorResponse): void => {
  res.status(error.status).json({
    message: error.message,
    status: error.status,
  });
};

function buildWriterSummary(
  writer: IUser | null,
  followersCount: number,
  publishedBooks?: number,
  fallbackId?: string
): WriterSummary {
  if (!writer) {
    return {
      id: fallbackId ?? "",
      username: "Unknown Writer",
      profile: null,
      bio: null,
      avatar: null,
      followersCount,
      publishedBooks,
    };
  }

  return {
    id: writer._id.toString(),
    username: writer.username,
    profile: writer.profile ?? null,
    bio: writer.bio ?? null,
    avatar: writer.avatar ?? null,
    followersCount,
    publishedBooks,
  };
}

export function createMarketplaceController() {
  // GET /api/marketplace - paginated list of published books, default sort by newest
  const getMarketplaceBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = marketplacePaginationSchema.safeParse(req.query);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
        return;
      }

      const { page, limit } = parseResult.data;

      const match: mongoose.FilterQuery<IBook> = { status: "published" };
      const sortSpec = { publishedAt: -1, createdAt: -1 };

      const skip = (page - 1) * limit;

      const [books, total] = await Promise.all([
        Book.find(match).sort(sortSpec).skip(skip).limit(limit),
        Book.countDocuments(match),
      ]);

      const writerIds = Array.from(new Set(books.map((book) => book.writerId.toString())));
      const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));

      const [writers, followerCounts] = await Promise.all([
        writerObjectIds.length
          ? User.find({ _id: { $in: writerObjectIds } })
          : Promise.resolve([] as IUser[]),
        writerObjectIds.length
          ? Follow.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
              { $match: { followingId: { $in: writerObjectIds } } },
              {
                $group: {
                  _id: "$followingId",
                  count: { $sum: 1 },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const writersMap = new Map(writers.map((writer) => [writer._id.toString(), writer]));
      const followerCountsMap = new Map(
        followerCounts.map((entry) => [entry._id.toString(), entry.count])
      );

      const items = books.map((book) => {
        const writer = writersMap.get(book.writerId.toString()) ?? null;
        const followersCount = followerCountsMap.get(book.writerId.toString()) ?? 0;

        return {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price,
          coverImage: book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(writer, followersCount, undefined, book.writerId.toString()),
        };
      });

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      const response: PaginatedResponse<typeof items[0]> = {
        items,
        page,
        totalPages,
        total,
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error("[MARKETPLACE] Get marketplace books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch marketplace books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  // GET /api/marketplace/search?q= - MongoDB text search across title/description/genres with relevance sorting
  const searchMarketplaceBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = marketplaceSearchSchema.safeParse(req.query);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
        return;
      }

      const { q: query, page, limit } = parseResult.data;

      const match: mongoose.FilterQuery<IBook> = {
        status: "published",
        $text: { $search: query },
      };

      const skip = (page - 1) * limit;

      const [books, total] = await Promise.all([
        Book.find(match, { score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit),
        Book.countDocuments(match),
      ]);

      const writerIds = Array.from(new Set(books.map((book) => book.writerId.toString())));
      const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));

      const [writers, followerCounts] = await Promise.all([
        writerObjectIds.length
          ? User.find({ _id: { $in: writerObjectIds } })
          : Promise.resolve([] as IUser[]),
        writerObjectIds.length
          ? Follow.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
              { $match: { followingId: { $in: writerObjectIds } } },
              {
                $group: {
                  _id: "$followingId",
                  count: { $sum: 1 },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const writersMap = new Map(writers.map((writer) => [writer._id.toString(), writer]));
      const followerCountsMap = new Map(
        followerCounts.map((entry) => [entry._id.toString(), entry.count])
      );

      const items = books.map((book) => {
        const writer = writersMap.get(book.writerId.toString()) ?? null;
        const followersCount = followerCountsMap.get(book.writerId.toString()) ?? 0;

        return {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price,
          coverImage: book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(writer, followersCount, undefined, book.writerId.toString()),
        };
      });

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      const response: PaginatedResponse<typeof items[0]> = {
        items,
        page,
        totalPages,
        total,
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error("[MARKETPLACE] Search marketplace books error:", error);
      sendErrorResponse(res, {
        message: "Failed to search marketplace books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  // GET /api/marketplace/filter - supporting combined filters and sort options
  const filterMarketplaceBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = marketplaceFilterSchema.safeParse(req.query);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
        return;
      }

      const {
        page,
        limit,
        category,
        minPrice,
        maxPrice,
        minRating,
        language,
        publishedAfter,
        publishedBefore,
        sort,
      } = parseResult.data;

      const match: mongoose.FilterQuery<IBook> = { status: "published" };

      if (category) {
        match.category = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (minPrice !== undefined) {
          priceFilter.$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          priceFilter.$lte = maxPrice;
        }
        match.price = priceFilter;
      }

      if (minRating !== undefined) {
        match.averageRating = { $gte: minRating };
      }

      if (language) {
        match.language = language;
      }

      if (publishedAfter || publishedBefore) {
        const dateFilter: Record<string, Date> = {};
        if (publishedAfter) {
          dateFilter.$gte = publishedAfter;
        }
        if (publishedBefore) {
          dateFilter.$lte = publishedBefore;
        }
        match.publishedAt = dateFilter;
      }

      const sortOptions: Record<string, Record<string, 1 | -1>> = {
        newest: { publishedAt: -1, createdAt: -1 },
        "most-reviewed": { reviewCount: -1, publishedAt: -1 },
        "highest-rated": { averageRating: -1, reviewCount: -1, publishedAt: -1 },
        "price-asc": { price: 1, publishedAt: -1 },
        "price-desc": { price: -1, publishedAt: -1 },
      };

      const sortSpec = sortOptions[sort] ?? sortOptions.newest;
      const skip = (page - 1) * limit;

      const [books, total] = await Promise.all([
        Book.find(match).sort(sortSpec).skip(skip).limit(limit),
        Book.countDocuments(match),
      ]);

      const writerIds = Array.from(new Set(books.map((book) => book.writerId.toString())));
      const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));

      const [writers, followerCounts] = await Promise.all([
        writerObjectIds.length
          ? User.find({ _id: { $in: writerObjectIds } })
          : Promise.resolve([] as IUser[]),
        writerObjectIds.length
          ? Follow.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
              { $match: { followingId: { $in: writerObjectIds } } },
              {
                $group: {
                  _id: "$followingId",
                  count: { $sum: 1 },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const writersMap = new Map(writers.map((writer) => [writer._id.toString(), writer]));
      const followerCountsMap = new Map(
        followerCounts.map((entry) => [entry._id.toString(), entry.count])
      );

      const items = books.map((book) => {
        const writer = writersMap.get(book.writerId.toString()) ?? null;
        const followersCount = followerCountsMap.get(book.writerId.toString()) ?? 0;

        return {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price,
          coverImage: book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(writer, followersCount, undefined, book.writerId.toString()),
        };
      });

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      const response: PaginatedResponse<typeof items[0]> = {
        items,
        page,
        totalPages,
        total,
      };

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error("[MARKETPLACE] Filter marketplace books error:", error);
      sendErrorResponse(res, {
        message: "Failed to filter marketplace books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  // GET /api/marketplace/trending - top-rated/most-reviewed books within recent timeframe
  const getTrendingBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = marketplaceTrendingSchema.safeParse(req.query);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
        return;
      }

      const { days, limit } = parseResult.data;
      
      // Create cache key based on parameters
      const cacheKey = `trending:${days}:${limit}`;
      
      // Try to get from cache first
      const cached = marketplaceCache.get(cacheKey);
      if (cached) {
        res.status(StatusCodes.OK).json(cached);
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            status: "published",
            publishedAt: { $gte: cutoffDate },
            averageRating: { $gte: 4.0 },
            reviewCount: { $gte: 5 },
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$averageRating", 10] },
                { $multiply: ["$reviewCount", 2] },
                { $divide: [{ $subtract: [new Date(), "$publishedAt"] }, 1000 * 60 * 60 * 24] },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1, averageRating: -1, reviewCount: -1 } },
        { $limit: limit },
      ];

      const books = await Book.aggregate(pipeline);

      const writerIds = Array.from(new Set(books.map((book) => book.writerId.toString())));
      const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));

      const [writers, followerCounts] = await Promise.all([
        writerObjectIds.length
          ? User.find({ _id: { $in: writerObjectIds } })
          : Promise.resolve([] as IUser[]),
        writerObjectIds.length
          ? Follow.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
              { $match: { followingId: { $in: writerObjectIds } } },
              {
                $group: {
                  _id: "$followingId",
                  count: { $sum: 1 },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      const writersMap = new Map(writers.map((writer) => [writer._id.toString(), writer]));
      const followerCountsMap = new Map(
        followerCounts.map((entry) => [entry._id.toString(), entry.count])
      );

      const items = books.map((book) => {
        const writer = writersMap.get(book.writerId.toString()) ?? null;
        const followersCount = followerCountsMap.get(book.writerId.toString()) ?? 0;

        return {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price,
          coverImage: book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(writer, followersCount, undefined, book.writerId.toString()),
        };
      });

      const response = { items };
      
      // Cache the result for 10 minutes
      marketplaceCache.set(cacheKey, response, 10 * 60 * 1000);

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error("[MARKETPLACE] Get trending books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch trending books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  // GET /api/marketplace/categories - returning distinct categories/genres from published books
  const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      // Try to get from cache first
      const cached = marketplaceCache.get("categories");
      if (cached) {
        res.status(StatusCodes.OK).json(cached);
        return;
      }

      const [categories, genres] = await Promise.all([
        Book.distinct("category", { status: "published" }),
        Book.aggregate([
          { $match: { status: "published" } },
          { $unwind: "$genres" },
          { $group: { _id: "$genres", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { name: "$_id", count: 1, _id: 0 } },
        ]),
      ]);

      const response = {
        categories: categories.sort(),
        genres,
      };

      // Cache the result for 15 minutes
      marketplaceCache.set("categories", response, 15 * 60 * 1000);

      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error("[MARKETPLACE] Get categories error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch categories",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  return {
    getMarketplaceBooks,
    searchMarketplaceBooks,
    filterMarketplaceBooks,
    getTrendingBooks,
    getCategories,
  };
}