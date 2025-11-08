"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const mongoose_1 = require("mongoose");
const FeedActivity_1 = require("../models/FeedActivity");
const Follow_1 = require("../models/Follow");
class FeedService {
    async record(activityType, payload, session) {
        try {
            const userId = new mongoose_1.Types.ObjectId(payload.userId);
            const targetId = new mongoose_1.Types.ObjectId(payload.targetId);
            const activity = new FeedActivity_1.FeedActivity({
                userId,
                activityType,
                targetId,
                metadata: payload.metadata || {},
            });
            if (session) {
                await activity.save({ session });
            }
            else {
                await activity.save();
            }
        }
        catch (error) {
            console.error("[FeedService] Error recording activity:", error);
            // Silently fail to not block main operations
        }
    }
    async getPersonalFeed(userId, options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;
        try {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            // Get writers the user follows
            const follows = await Follow_1.Follow.find({ followerId: userObjectId }).select("followingId");
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
                FeedActivity_1.FeedActivity.find({ userId: { $in: followingIds } })
                    .populate("userId", "username avatar")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                FeedActivity_1.FeedActivity.countDocuments({ userId: { $in: followingIds } }),
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
        }
        catch (error) {
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
    async getGlobalFeed(options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;
        try {
            const [activities, total] = await Promise.all([
                FeedActivity_1.FeedActivity.find({})
                    .populate("userId", "username avatar")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                FeedActivity_1.FeedActivity.countDocuments({}),
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
        }
        catch (error) {
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
    serializeActivities(activities) {
        return activities.map((activity) => {
            const user = activity.userId;
            let userInfo;
            if (user && typeof user === "object") {
                const userData = user;
                userInfo = {
                    id: userData._id?.toString() || "",
                    username: userData.username || "Unknown",
                    avatar: userData.avatar || null,
                };
            }
            return {
                id: activity._id.toString(),
                activityType: activity.activityType,
                createdAt: activity.createdAt,
                user: userInfo,
                metadata: activity.metadata,
            };
        });
    }
}
exports.FeedService = FeedService;
//# sourceMappingURL=feedService.js.map