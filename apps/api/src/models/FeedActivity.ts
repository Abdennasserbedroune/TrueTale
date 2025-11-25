import mongoose, { Document, Schema } from "mongoose";

export type ActivityType =
  | "book_published"
  | "review_created"
  | "follow_created"
  | "follow_removed"
  | "story_published"
  | "draft_created";

export interface IFeedActivity extends Document {
  userId: mongoose.Types.ObjectId;
  activityType: ActivityType;
  targetId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const feedActivitySchema = new Schema<IFeedActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        "book_published",
        "review_created",
        "follow_created",
        "follow_removed",
        "story_published",
        "draft_created",
      ],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user activity feed queries
feedActivitySchema.index({ userId: 1, createdAt: -1 });

// Index for activity type queries
feedActivitySchema.index({ activityType: 1, createdAt: -1 });

// Static method to get user feed
feedActivitySchema.statics.getUserFeed = function (
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 20,
  activityTypes?: ActivityType[]
) {
  const query: { userId: mongoose.Types.ObjectId; activityType?: { $in: ActivityType[] } } = {
    userId,
  };

  if (activityTypes && activityTypes.length > 0) {
    query.activityType = { $in: activityTypes };
  }

  return this.find(query)
    .populate("userId", "username avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to create activity
feedActivitySchema.statics.createActivity = function (
  userId: mongoose.Types.ObjectId,
  activityType: ActivityType,
  targetId: mongoose.Types.ObjectId,
  metadata?: Record<string, unknown>
) {
  return this.create({
    userId,
    activityType,
    targetId,
    metadata: metadata || {},
  });
};

// Static method to get activities by target
feedActivitySchema.statics.getActivitiesByTarget = function (
  targetId: mongoose.Types.ObjectId,
  activityType?: ActivityType
) {
  const query: { targetId: mongoose.Types.ObjectId; activityType?: ActivityType } = { targetId };

  if (activityType) {
    query.activityType = activityType;
  }

  return this.find(query).populate("userId", "username avatar").sort({ createdAt: -1 }).limit(50);
};

export const FeedActivity = mongoose.models.FeedActivity || mongoose.model<IFeedActivity>("FeedActivity", feedActivitySchema);
