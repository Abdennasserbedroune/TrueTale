import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { FeedService } from "../utils/feedService";
import { Book, Follow, Review, User, IBook, IReview, IUser } from "../models";
import {
  browseBooksQuerySchema,
  paginationQuerySchema,
  readerProfileUpdateSchema,
  reviewMutationSchema,
  updateReviewSchema,
} from "../validation/readerValidation";

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

type ReviewStats = {
  averageRating: number;
  reviewCount: number;
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

const isValidObjectId = (value: string): boolean => Types.ObjectId.isValid(value);

const serializeProfile = (user: IUser) => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  role: user.role,
  profile: user.profile,
  bio: user.bio,
  avatar: user.avatar,
  socials: user.socials,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildWriterSummary = (
  writer: IUser | null,
  followersCount: number,
  publishedBooks?: number,
  fallbackId?: string
): WriterSummary => ({
  id: writer ? writer._id.toString() : fallbackId ?? "",
  username: writer?.username ?? "Unknown writer",
  profile: writer?.profile ?? null,
  bio: writer?.bio ?? null,
  avatar: writer?.avatar ?? null,
  followersCount,
  ...(typeof publishedBooks === "number" ? { publishedBooks } : {}),
});

const buildReviewResponse = (
  review: IReview,
  user?: { id: string; username: string; avatar?: string | null }
) => {
  let derivedUser = user;

  if (!derivedUser) {
    const reviewUser = review.userId as unknown;

    if (typeof reviewUser === "string") {
      derivedUser = { id: reviewUser, username: "" };
    } else if (reviewUser instanceof mongoose.Types.ObjectId) {
      derivedUser = { id: reviewUser.toString(), username: "" };
    } else {
      const populatedUser = reviewUser as IUser;
      const populatedId =
        populatedUser._id instanceof mongoose.Types.ObjectId
          ? populatedUser._id.toString()
          : String(populatedUser._id);

      derivedUser = {
        id: populatedId,
        username: populatedUser.username ?? "",
        avatar: populatedUser.avatar ?? null,
      };
    }
  }

  const responseUser = derivedUser ?? { id: "", username: "" };

  return {
    id: review._id.toString(),
    rating: review.rating,
    reviewText: review.reviewText,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: responseUser,
  };
};

async function recalculateBookAggregates(bookId: mongoose.Types.ObjectId): Promise<void> {
  const stats = await Review.aggregate<ReviewStats & { _id: mongoose.Types.ObjectId }>([
    { $match: { bookId } },
    {
      $group: {
        _id: "$bookId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const computedStats = stats[0];
  const averageRating = computedStats ? Math.round(computedStats.averageRating * 100) / 100 : 0;
  const reviewCount = computedStats ? computedStats.reviewCount : 0;

  await Book.findByIdAndUpdate(bookId, {
    averageRating,
    reviewCount,
  });
}

export function createReaderController(feedService: FeedService) {
  const listBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = browseBooksQuerySchema.safeParse(req.query);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
        return;
      }

      const {
        page,
        limit,
        search,
        category,
        genre,
        writerId,
        minRating,
        maxRating,
        minPrice,
        maxPrice,
        sort,
      } = parseResult.data;

      const match: mongoose.FilterQuery<IBook> = { status: "published" };

      if (search) {
        match.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ] as mongoose.FilterQuery<IBook>[];
      }

      if (category) {
        match.category = category;
      }

      if (genre) {
        match.genres = { $in: [genre] };
      }

      if (writerId) {
        match.authorId = new Types.ObjectId(writerId);
      }

      if (minRating !== undefined || maxRating !== undefined) {
        const ratingFilter: Record<string, number> = {};
        if (minRating !== undefined) {
          ratingFilter.$gte = minRating;
        }
        if (maxRating !== undefined) {
          ratingFilter.$lte = maxRating;
        }
        match.averageRating = ratingFilter;
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

      const sortOptions: Record<string, Record<string, 1 | -1>> = {
        recent: { publishedAt: -1, createdAt: -1 },
        rating_desc: { averageRating: -1, reviewCount: -1, publishedAt: -1 },
        rating_asc: { averageRating: 1, publishedAt: -1 },
        price_desc: { price: -1, publishedAt: -1 },
        price_asc: { price: 1, publishedAt: -1 },
      };

      const sortSpec = sortOptions[sort] ?? sortOptions.recent;

      const skip = (page - 1) * limit;

      const [books, total] = await Promise.all([
        Book.find(match).sort(sortSpec).skip(skip).limit(limit),
        Book.countDocuments(match),
      ]);

      const writerIds = Array.from(new Set(books.map((book) => book.authorId.toString())));
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

      const data = books.map((book) => {
        const writer = writersMap.get(book.authorId.toString()) ?? null;
        const followersCount = followerCountsMap.get(book.authorId.toString()) ?? 0;

        return {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.priceCents / 100,
          coverImage: book.coverUrl || book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(writer, followersCount, undefined, book.authorId.toString()),
        };
      });

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(StatusCodes.OK).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("[READER] List books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getBookDetail = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      sendErrorResponse(res, {
        message: "Invalid book id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const parseResult = paginationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { page, limit } = parseResult.data;

    try {
      const book = await Book.findOne({ _id: id, status: "published" });

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const [writer, followersCount, publishedBooks] = await Promise.all([
        User.findById(book.authorId),
        Follow.countDocuments({ followingId: book.authorId }),
        Book.countDocuments({ authorId: book.authorId, status: "published" }),
      ]);

      const [reviews, stats, distribution] = await Promise.all([
        Review.find({ bookId: book._id })
          .populate("userId", "username avatar")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Review.aggregate<ReviewStats & { _id: mongoose.Types.ObjectId }>([
          { $match: { bookId: book._id } },
          {
            $group: {
              _id: "$bookId",
              averageRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ]),
        Review.aggregate<{ _id: number; count: number }>([
          { $match: { bookId: book._id } },
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const statsDoc = stats[0];
      const reviewCount = statsDoc ? statsDoc.reviewCount : 0;
      const averageRating = statsDoc ? Math.round(statsDoc.averageRating * 100) / 100 : 0;

      const distributionMap: Record<string, number> = {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
      };

      distribution.forEach((entry) => {
        distributionMap[String(entry._id)] = entry.count;
      });

      const reviewData = reviews.map((review) => {
        const reviewer = review.userId as IUser;
        return buildReviewResponse(review, {
          id: (reviewer._id as mongoose.Types.ObjectId).toString(),
          username: reviewer.username,
          avatar: reviewer.avatar,
        });
      });

      const totalPages = reviewCount === 0 ? 0 : Math.ceil(reviewCount / limit);

      res.status(StatusCodes.OK).json({
        book: {
          id: book._id.toString(),
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.priceCents / 100,
          coverImage: book.coverUrl || book.coverImage,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          publishedAt: book.publishedAt,
          writer: buildWriterSummary(
            writer ?? null,
            followersCount,
            publishedBooks,
            book.authorId.toString()
          ),
        },
        reviews: {
          data: reviewData,
          pagination: {
            page,
            limit,
            total: reviewCount,
            totalPages,
          },
          stats: {
            averageRating,
            reviewCount,
            distribution: distributionMap,
          },
        },
      });
    } catch (error) {
      console.error("[READER] Get book detail error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch book",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const upsertReview = async (req: Request, res: Response): Promise<void> => {
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

    const parseResult = reviewMutationSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { rating, reviewText } = parseResult.data;

    try {
      const book = await Book.findOne({ _id: id, status: "published" });

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const userId = new Types.ObjectId(req.user.userId);

      if (book.authorId.equals(userId)) {
        sendErrorResponse(res, {
          message: "Writers cannot review their own books",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const existingReview = await Review.findOne({ userId, bookId: book._id });
      let review: IReview | null = existingReview;
      let created = false;

      if (review) {
        review.rating = rating;
        review.reviewText = reviewText;
      } else {
        review = new Review({
          userId,
          bookId: book._id,
          rating,
          reviewText,
        });
        created = true;
      }

      await review.save();

      if (created) {
        await feedService.record("review_created", {
          userId: req.user.userId,
          targetId: book._id.toString(),
          metadata: { rating },
        });
      }

      const status = created ? StatusCodes.CREATED : StatusCodes.OK;

      res.status(status).json({
        review: buildReviewResponse(review, {
          id: req.user.userId,
          username: req.user.username,
        }),
        message: created ? "Review created" : "Review updated",
      });
    } catch (error) {
      console.error("[READER] Upsert review error:", error);
      sendErrorResponse(res, {
        message: "Failed to save review",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getUserReviews = async (req: Request, res: Response): Promise<void> => {
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
    const userId = new Types.ObjectId(req.user.userId);

    try {
      const [reviews, total] = await Promise.all([
        Review.find({ userId })
          .populate("bookId", "title coverImage status writerId averageRating reviewCount")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Review.countDocuments({ userId }),
      ]);

      const data = reviews.map((review) => {
        const bookDoc = review.bookId as unknown as IBook | null;
        const bookSummary = bookDoc
          ? {
              id: bookDoc._id.toString(),
              title: bookDoc.title,
              coverImage: bookDoc.coverUrl || bookDoc.coverImage,
              status: bookDoc.status,
              authorId: bookDoc.authorId.toString(),
              averageRating: bookDoc.averageRating,
              reviewCount: bookDoc.reviewCount,
            }
          : null;

        return {
          ...buildReviewResponse(review, {
            id: req.user!.userId,
            username: req.user!.username,
          }),
          book: bookSummary,
        };
      });

      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(StatusCodes.OK).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("[READER] Get user reviews error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch reviews",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const updateReview = async (req: Request, res: Response): Promise<void> => {
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
        message: "Invalid review id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const parseResult = updateReviewSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    try {
      const review = await Review.findById(id);

      if (!review) {
        sendErrorResponse(res, {
          message: "Review not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (review.userId.toString() !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this review",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const updates = parseResult.data;

      if (Object.prototype.hasOwnProperty.call(updates, "rating")) {
        review.rating = updates.rating!;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "reviewText")) {
        review.reviewText = updates.reviewText!;
      }

      await review.save();

      res.status(StatusCodes.OK).json({
        review: buildReviewResponse(review, {
          id: req.user.userId,
          username: req.user.username,
        }),
      });
    } catch (error) {
      console.error("[READER] Update review error:", error);
      sendErrorResponse(res, {
        message: "Failed to update review",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const deleteReview = async (req: Request, res: Response): Promise<void> => {
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
        message: "Invalid review id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const review = await Review.findById(id);

      if (!review) {
        sendErrorResponse(res, {
          message: "Review not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (review.userId.toString() !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this review",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const bookId = review.bookId as mongoose.Types.ObjectId;

      await review.deleteOne();
      await recalculateBookAggregates(bookId);

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      console.error("[READER] Delete review error:", error);
      sendErrorResponse(res, {
        message: "Failed to delete review",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const followWriter = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { writerId } = req.params;

    if (!isValidObjectId(writerId)) {
      sendErrorResponse(res, {
        message: "Invalid writer id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const writer = await User.findById(writerId);

      if (!writer) {
        sendErrorResponse(res, {
          message: "Writer not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (writer.role !== "writer") {
        sendErrorResponse(res, {
          message: "Target user is not a writer",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const followerId = new Types.ObjectId(req.user.userId);
      const followingId = writer._id as mongoose.Types.ObjectId;

      if (followerId.equals(followingId)) {
        sendErrorResponse(res, {
          message: "You cannot follow yourself",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const session = await mongoose.startSession();
      let created = false;

      try {
        await session.withTransaction(async () => {
          const existingFollow = await Follow.findOne({
            followerId,
            followingId,
          }).session(session);

          if (existingFollow) {
            return;
          }

          const follow = new Follow({
            followerId,
            followingId,
          });

          await follow.save({ session });
          created = true;

          await feedService.record(
            "follow_created",
            {
              userId: req.user!.userId,
              targetId: followingId.toString(),
            },
            session
          );
        });
      } finally {
        await session.endSession();
      }

      const followersCount = await Follow.countDocuments({ followingId });

      res.status(StatusCodes.OK).json({
        message: created ? "Followed writer" : "Already following writer",
        following: true,
        followersCount,
      });
    } catch (error) {
      console.error("[READER] Follow writer error:", error);
      sendErrorResponse(res, {
        message: "Failed to follow writer",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const unfollowWriter = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const { writerId } = req.params;

    if (!isValidObjectId(writerId)) {
      sendErrorResponse(res, {
        message: "Invalid writer id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const followerId = new Types.ObjectId(req.user.userId);
      const followingId = new Types.ObjectId(writerId);
      const session = await mongoose.startSession();
      let removed = false;

      try {
        await session.withTransaction(async () => {
          const follow = await Follow.findOne({ followerId, followingId }).session(session);

          if (!follow) {
            return;
          }

          await follow.deleteOne({ session });
          removed = true;

          await feedService.record(
            "follow_removed",
            {
              userId: req.user!.userId,
              targetId: followingId.toString(),
            },
            session
          );
        });
      } finally {
        await session.endSession();
      }

      const followersCount = await Follow.countDocuments({ followingId });

      res.status(StatusCodes.OK).json({
        message: removed ? "Unfollowed writer" : "You are not following this writer",
        following: false,
        followersCount,
      });
    } catch (error) {
      console.error("[READER] Unfollow writer error:", error);
      sendErrorResponse(res, {
        message: "Failed to unfollow writer",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getFollowing = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    try {
      const followerId = new Types.ObjectId(req.user.userId);
      const follows = await Follow.find({ followerId })
        .populate("followingId", "username profile bio avatar role")
        .sort({ createdAt: -1 });

      const writerIds = Array.from(
        new Set(
          follows
            .map((follow) => {
              const writer = follow.followingId as IUser;
              return writer?.role === "writer" ? writer._id.toString() : null;
            })
            .filter((id): id is string => Boolean(id))
        )
      );

      const writerObjectIds = writerIds.map((id) => new Types.ObjectId(id));

      const followerCounts = writerObjectIds.length
        ? await Follow.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: { followingId: { $in: writerObjectIds } } },
            {
              $group: {
                _id: "$followingId",
                count: { $sum: 1 },
              },
            },
          ])
        : [];

      const followerCountsMap = new Map(
        followerCounts.map((entry) => [entry._id.toString(), entry.count])
      );

      const data = follows
        .map((follow) => follow.followingId as IUser)
        .filter((writer): writer is IUser => writer?.role === "writer")
        .map((writer) => ({
          writer: buildWriterSummary(
            writer,
            followerCountsMap.get(writer._id.toString()) ?? 0
          ),
        }));

      res.status(StatusCodes.OK).json({
        data,
        total: data.length,
      });
    } catch (error) {
      console.error("[READER] Get following error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch following list",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const getFollowers = async (req: Request, res: Response): Promise<void> => {
    const { writerId } = req.params;

    if (!isValidObjectId(writerId)) {
      sendErrorResponse(res, {
        message: "Invalid writer id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    try {
      const followingId = new Types.ObjectId(writerId);
      const followers = await Follow.find({ followingId })
        .populate("followerId", "username profile bio avatar")
        .sort({ createdAt: -1 });

      const data = followers.map((follow) => {
        const follower = follow.followerId as IUser;
        return {
          id: follower._id.toString(),
          username: follower.username,
          profile: follower.profile,
          bio: follower.bio,
          avatar: follower.avatar,
        };
      });

      res.status(StatusCodes.OK).json({
        data,
        total: data.length,
      });
    } catch (error) {
      console.error("[READER] Get followers error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch followers list",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const checkFollowing = async (req: Request, res: Response): Promise<void> => {
    const { writerId } = req.params;

    if (!isValidObjectId(writerId)) {
      sendErrorResponse(res, {
        message: "Invalid writer id",
        status: StatusCodes.BAD_REQUEST,
      });
      return;
    }

    const userId = req.user?.userId;

    if (!userId) {
      res.status(StatusCodes.OK).json({ isFollowing: false });
      return;
    }

    try {
      const followerId = new Types.ObjectId(userId);
      const followingId = new Types.ObjectId(writerId);

      const follow = await Follow.findOne({ followerId, followingId });

      res.status(StatusCodes.OK).json({
        isFollowing: !!follow,
      });
    } catch (error) {
      console.error("[READER] Check following error:", error);
      sendErrorResponse(res, {
        message: "Failed to check follow status",
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

    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        sendErrorResponse(res, {
          message: "Profile not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const [followersCount, followingCount, reviewsCount] = await Promise.all([
        Follow.countDocuments({ followingId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Review.countDocuments({ userId: user._id }),
      ]);

      res.status(StatusCodes.OK).json({
        profile: serializeProfile(user),
        stats: {
          followers: followersCount,
          following: followingCount,
          reviews: reviewsCount,
        },
      });
    } catch (error) {
      console.error("[READER] Get profile error:", error);
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

    const parseResult = readerProfileUpdateSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        sendErrorResponse(res, {
          message: "Profile not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      const updates = { ...parseResult.data };

      if (req.user.role === "writer" && Object.prototype.hasOwnProperty.call(updates, "profile")) {
        delete updates.profile;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "profile")) {
        user.profile = updates.profile ?? user.profile;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
        user.bio = updates.bio ?? user.bio;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "avatar")) {
        user.avatar = updates.avatar ?? user.avatar;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "socials")) {
        user.socials = updates.socials;
      }

      await user.save();

      res.status(StatusCodes.OK).json({
        profile: serializeProfile(user),
      });
    } catch (error) {
      console.error("[READER] Update profile error:", error);
      sendErrorResponse(res, {
        message: "Failed to update profile",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  return {
    listBooks,
    getBookDetail,
    upsertReview,
    getUserReviews,
    updateReview,
    deleteReview,
    followWriter,
    unfollowWriter,
    getFollowing,
    getFollowers,
    checkFollowing,
    getProfile,
    updateProfile,
  };
}
