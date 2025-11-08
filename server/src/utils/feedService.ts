import mongoose, { ClientSession, Types } from "mongoose";
import { ActivityType, FeedActivity, IFeedActivity } from "../models/FeedActivity";
import { Follow } from "../models/Follow";

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
