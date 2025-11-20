import mongoose, { ClientSession, Types } from "mongoose";
import { ActivityType, FeedActivity, IFeedActivity } from "@truetale/db";
import { Follow } from "@truetale/db";

export interface FeedRecordPayload {
  userId: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export interface FeedQueryOptions {
  page?: number;
  limit?: number;
}

export interface SerializedFeedItem {
  id: string;
  activityType: ActivityType;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  metadata?: Record<string, unknown>;
}

export class FeedService {
  async record(
    activityType: ActivityType,
    payload: FeedRecordPayload,
    session?: ClientSession
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(payload.userId);
      const targetId = new Types.ObjectId(payload.targetId);

      const activity = new FeedActivity({
        userId,
        activityType,
        targetId,
        metadata: payload.metadata || {},
      });

      if (session) {
        await activity.save({ session });
      } else {
        await activity.save();
      }
    } catch (error) {
      console.error("[FeedService] Error recording activity:", error);
      // Silently fail to not block main operations
    }
  }

  async getPersonalFeed(
    userId: string,
    options: FeedQueryOptions = {}
  ): Promise<{
    activities: SerializedFeedItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const userObjectId = new Types.ObjectId(userId);

      // Get writers the user follows
      const follows = await Follow.find({ followerId: userObjectId }).select("followingId");
      const followingIds = follows.map((f) => f.followingId);

      if (followingIds.length === 0) {
        return {
          activities: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Get activities from followed writers
      const [activities, total] = await Promise.all([
        FeedActivity.find({ userId: { $in: followingIds } })
          .populate("userId", "username avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FeedActivity.countDocuments({ userId: { $in: followingIds } }),
      ]);

      const serialized = this.serializeActivities(activities);
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      return {
        activities: serialized,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error("[FeedService] Error fetching personal feed:", error);
      return {
        activities: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async getGlobalFeed(options: FeedQueryOptions = {}): Promise<{
    activities: SerializedFeedItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const [activities, total] = await Promise.all([
        FeedActivity.find({})
          .populate("userId", "username avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FeedActivity.countDocuments({}),
      ]);

      const serialized = this.serializeActivities(activities);
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      return {
        activities: serialized,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error("[FeedService] Error fetching global feed:", error);
      return {
        activities: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async getTrendingBooks(options: { limit?: number; days?: number } = {}): Promise<any[]> {
    const limit = options.limit || 10;
    const days = options.days || 7;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Import Book model dynamically to avoid circular dependency
      const { Book } = await import("@truetale/db");
      const { Review } = await import("@truetale/db");
      const { User } = await import("@truetale/db");

      const trendingBooks = await Book.aggregate([
        {
          $match: {
            status: "published",
            updatedAt: { $gte: cutoffDate },
          },
        },
        {
          $lookup: {
            from: "reviews",
            let: { bookId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$bookId", "$bookId"] },
                  createdAt: { $gte: cutoffDate },
                },
              },
            ],
            as: "recentReviews",
          },
        },
        {
          $addFields: {
            recentReviewCount: { $size: "$recentReviews" },
            salesCount: { $ifNull: ["$stats.sales", 0] },
            viewsCount: { $ifNull: ["$stats.views", 0] },
            trendScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$stats.sales", 0] }, 0.5] },
                { $multiply: [{ $ifNull: ["$stats.views", 0] }, 0.1] },
                { $multiply: [{ $size: "$recentReviews" }, 1.0] },
              ],
            },
          },
        },
        { $sort: { trendScore: -1 } },
        { $limit: limit },
        {
          $project: {
            title: 1,
            slug: 1,
            authorId: 1,
            priceCents: 1,
            coverUrl: 1,
            coverImage: 1,
            description: 1,
            averageRating: 1,
            reviewCount: 1,
            stats: 1,
            trendScore: 1,
            recentReviewCount: 1,
          },
        },
      ]);

      // Populate author info
      const authorIds = trendingBooks.map((book: any) => book.authorId);
      const authors = await User.find({ _id: { $in: authorIds } }).select(
        "username avatar bio"
      );
      const authorsMap = new Map(authors.map((author: any) => [author._id.toString(), author]));

      return trendingBooks.map((book: any) => {
        const author = authorsMap.get(book.authorId.toString());
        return {
          id: book._id.toString(),
          title: book.title,
          slug: book.slug,
          coverImage: book.coverUrl || book.coverImage,
          description: book.description,
          price: book.priceCents / 100,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount,
          stats: book.stats,
          trendScore: book.trendScore,
          recentReviewCount: book.recentReviewCount,
          author: author
            ? {
                id: author._id.toString(),
                username: author.username,
                avatar: author.avatar,
                bio: author.bio,
              }
            : null,
        };
      });
    } catch (error) {
      console.error("[FeedService] Error fetching trending books:", error);
      return [];
    }
  }

  private serializeActivities(activities: IFeedActivity[]): SerializedFeedItem[] {
    return activities.map((activity) => {
      const user = activity.userId as unknown;
      let userInfo: SerializedFeedItem["user"] | undefined;

      if (user && typeof user === "object") {
        const userData = user as any;
        userInfo = {
          id: userData._id?.toString() || "",
          username: userData.username || "Unknown",
          avatar: userData.avatar || null,
        };
      }

      return {
        id: (activity._id as mongoose.Types.ObjectId).toString(),
        activityType: activity.activityType,
        createdAt: activity.createdAt,
        user: userInfo,
        metadata: activity.metadata,
      };
    });
  }
}
