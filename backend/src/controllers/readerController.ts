import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { db } from "@truetale/db";
import { FeedService } from "../utils/feedService";
import {
  browseBooksQuerySchema,
  paginationQuerySchema,
  reviewMutationSchema,
  updateReviewSchema,
} from "../validation/readerValidation";

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

      let query = db.from("books").select("*, writer:users(username, profile, avatar)", { count: "exact" })
        .eq("status", "published");

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (genre) {
        query = query.contains("genres", [genre]);
      }

      if (writerId) {
        query = query.eq("writer_id", writerId);
      }

      if (minRating !== undefined) {
        query = query.gte("average_rating", minRating);
      }
      if (maxRating !== undefined) {
        query = query.lte("average_rating", maxRating);
      }

      if (minPrice !== undefined) {
        query = query.gte("price_cents", minPrice * 100);
      }
      if (maxPrice !== undefined) {
        query = query.lte("price_cents", maxPrice * 100);
      }

      const sortOptions: Record<string, { column: string; ascending: boolean }> = {
        recent: { column: "created_at", ascending: false },
        rating_desc: { column: "average_rating", ascending: false },
        rating_asc: { column: "average_rating", ascending: true },
        price_desc: { column: "price_cents", ascending: false },
        price_asc: { column: "price_cents", ascending: true },
      };

      const sortSpec = sortOptions[sort] ?? sortOptions.recent;
      query = query.order(sortSpec.column, { ascending: sortSpec.ascending });

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: books, count, error } = await query.range(from, to);

      if (error) throw error;

      // Fetch follower counts for writers
      const writerIds = Array.from(new Set(books?.map((b) => b.writer_id) || []));

      const { data: followerCounts } = await db
        .from("follows")
        .select("following_id")
        .in("following_id", writerIds);

      const followerCountMap = new Map<string, number>();
      followerCounts?.forEach((f) => {
        const id = f.following_id;
        followerCountMap.set(id, (followerCountMap.get(id) || 0) + 1);
      });

      const data = books?.map((book) => {
        // @ts-ignore
        const writer = book.writer;
        const followersCount = followerCountMap.get(book.writer_id) || 0;

        return {
          id: book.id,
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price_cents / 100,
          coverImage: book.cover_url,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.average_rating,
          reviewCount: book.review_count,
          publishedAt: book.created_at, // Assuming published_at is not separate or using created_at
          writer: {
            id: book.writer_id,
            username: writer?.username || "Unknown",
            avatar: writer?.avatar,
            followersCount,
          },
        };
      });

      const totalPages = count ? Math.ceil(count / limit) : 0;

      res.status(StatusCodes.OK).json({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
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

    const parseResult = paginationQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { page, limit } = parseResult.data;

    try {
      const { data: book, error: bookError } = await db
        .from("books")
        .select("*, writer:users(*)")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (bookError || !book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      // @ts-ignore
      const writer = book.writer;

      const [followersCount, publishedBooks] = await Promise.all([
        db.from("follows").select("*", { count: "exact", head: true }).eq("following_id", book.writer_id),
        db.from("books").select("*", { count: "exact", head: true }).eq("writer_id", book.writer_id).eq("status", "published"),
      ]);

      const { data: reviews, count: reviewCount } = await db
        .from("reviews")
        .select("*, user:users(username, avatar)", { count: "exact" })
        .eq("book_id", id)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, (page - 1) * limit + limit - 1);

      // Calculate stats manually or via RPC if available. For now using simple aggregation if possible or just returning book stats
      // Supabase doesn't have simple aggregation in JS client without RPC.
      // We will use the pre-calculated stats on the book model which should be updated on review creation.

      const { data: ratingDist } = await db
        .from("reviews")
        .select("rating")
        .eq("book_id", id);

      const distributionMap: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      ratingDist?.forEach((r) => {
        const key = String(r.rating);
        if (distributionMap[key] !== undefined) distributionMap[key]++;
      });

      const reviewData = reviews?.map((review) => ({
        id: review.id,
        rating: review.rating,
        reviewText: review.review_text,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: {
          // @ts-ignore
          id: review.user_id,
          // @ts-ignore
          username: review.user?.username || "",
          // @ts-ignore
          avatar: review.user?.avatar,
        },
      }));

      const totalPages = reviewCount ? Math.ceil(reviewCount / limit) : 0;

      res.status(StatusCodes.OK).json({
        book: {
          id: book.id,
          title: book.title,
          description: book.description,
          category: book.category,
          price: book.price_cents / 100,
          coverImage: book.cover_url,
          genres: book.genres,
          language: book.language,
          pages: book.pages,
          averageRating: book.average_rating,
          reviewCount: book.review_count,
          publishedAt: book.created_at,
          writer: {
            id: writer.id,
            username: writer.username,
            profile: writer.profile,
            bio: writer.bio,
            avatar: writer.avatar,
            followersCount: followersCount.count || 0,
            publishedBooks: publishedBooks.count || 0,
          },
        },
        reviews: {
          data: reviewData,
          pagination: {
            page,
            limit,
            total: reviewCount || 0,
            totalPages,
          },
          stats: {
            averageRating: book.average_rating,
            reviewCount: book.review_count,
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
    const parseResult = reviewMutationSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    const { rating, reviewText } = parseResult.data;
    const userId = req.user.userId;

    try {
      const { data: book } = await db.from("books").select("*").eq("id", id).eq("status", "published").single();

      if (!book) {
        sendErrorResponse(res, {
          message: "Book not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (book.writer_id === userId) {
        sendErrorResponse(res, {
          message: "Writers cannot review their own books",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const { data: existingReview } = await db
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("book_id", id)
        .maybeSingle();

      let review;
      let created = false;

      if (existingReview) {
        const { data, error } = await db
          .from("reviews")
          .update({
            rating,
            review_text: reviewText,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id)
          .select()
          .single();

        if (error) throw error;
        review = data;
      } else {
        const { data, error } = await db
          .from("reviews")
          .insert({
            user_id: userId,
            book_id: id,
            rating,
            review_text: reviewText,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        review = data;
        created = true;
      }

      // Update book stats
      // Ideally use a database trigger or RPC for atomic updates
      // For now, simple recalculation
      const { data: allReviews } = await db.from("reviews").select("rating").eq("book_id", id);
      if (allReviews) {
        const count = allReviews.length;
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

        await db.from("books").update({
          review_count: count,
          average_rating: avg,
        }).eq("id", id);
      }

      if (created) {
        await feedService.record("review_created", {
          userId: req.user.userId,
          targetId: id,
          metadata: { rating },
        });
      }

      const status = created ? StatusCodes.CREATED : StatusCodes.OK;

      res.status(status).json({
        review: {
          id: review.id,
          rating: review.rating,
          reviewText: review.review_text,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
          user: {
            id: req.user.userId,
            username: req.user.username,
          },
        },
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
    const userId = req.user.userId;

    try {
      const { data: reviews, count, error } = await db
        .from("reviews")
        .select("*, book:books(*)", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, (page - 1) * limit + limit - 1);

      if (error) throw error;

      const data = reviews?.map((review) => {
        // @ts-ignore
        const book = review.book;
        return {
          id: review.id,
          rating: review.rating,
          reviewText: review.review_text,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
          user: {
            id: req.user!.userId,
            username: req.user!.username,
          },
          book: book ? {
            id: book.id,
            title: book.title,
            coverImage: book.cover_url,
            status: book.status,
            authorId: book.writer_id,
            averageRating: book.average_rating,
            reviewCount: book.review_count,
          } : null,
        };
      });

      const totalPages = count ? Math.ceil(count / limit) : 0;

      res.status(StatusCodes.OK).json({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
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
    const parseResult = updateReviewSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(StatusCodes.BAD_REQUEST).json(formatValidationError(parseResult.error));
      return;
    }

    try {
      const { data: review } = await db.from("reviews").select("*").eq("id", id).single();

      if (!review) {
        sendErrorResponse(res, {
          message: "Review not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (review.user_id !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this review",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (parseResult.data.rating) updates.rating = parseResult.data.rating;
      if (parseResult.data.reviewText) updates.review_text = parseResult.data.reviewText;

      const { data: updatedReview, error } = await db
        .from("reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update book stats
      const { data: allReviews } = await db.from("reviews").select("rating").eq("book_id", review.book_id);
      if (allReviews) {
        const count = allReviews.length;
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

        await db.from("books").update({
          review_count: count,
          average_rating: avg,
        }).eq("id", review.book_id);
      }

      res.status(StatusCodes.OK).json({
        review: {
          id: updatedReview.id,
          rating: updatedReview.rating,
          reviewText: updatedReview.review_text,
          createdAt: updatedReview.created_at,
          updatedAt: updatedReview.updated_at,
          user: {
            id: req.user.userId,
            username: req.user.username,
          },
        },
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

    try {
      const { data: review } = await db.from("reviews").select("*").eq("id", id).single();

      if (!review) {
        sendErrorResponse(res, {
          message: "Review not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      if (review.user_id !== req.user.userId) {
        sendErrorResponse(res, {
          message: "You do not have access to this review",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const { error } = await db.from("reviews").delete().eq("id", id);
      if (error) throw error;

      // Update book stats
      const { data: allReviews } = await db.from("reviews").select("rating").eq("book_id", review.book_id);
      if (allReviews) {
        const count = allReviews.length;
        const avg = count > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

        await db.from("books").update({
          review_count: count,
          average_rating: avg,
        }).eq("id", review.book_id);
      }

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

    try {
      const { data: writer } = await db.from("users").select("id, role").eq("id", writerId).single();

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

      const followerId = req.user.userId;
      const followingId = writer.id;

      if (followerId === followingId) {
        sendErrorResponse(res, {
          message: "You cannot follow yourself",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { data: existing } = await db
        .from("follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existing) {
        res.status(StatusCodes.OK).json({ message: "Already following" });
        return;
      }

      const { error } = await db.from("follows").insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      await feedService.record("user_followed", {
        userId: followerId,
        targetId: followingId,
      });

      res.status(StatusCodes.OK).json({ message: "Followed successfully" });
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

    try {
      const { error } = await db
        .from("follows")
        .delete()
        .eq("follower_id", req.user.userId)
        .eq("following_id", writerId);

      if (error) throw error;

      res.status(StatusCodes.OK).json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("[READER] Unfollow writer error:", error);
      sendErrorResponse(res, {
        message: "Failed to unfollow writer",
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
  };
}
