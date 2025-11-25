import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Indexes for common queries
followSchema.index({ followerId: 1, createdAt: -1 });
followSchema.index({ followingId: 1, createdAt: -1 });

// Static method to get followers
followSchema.statics.getFollowers = function (
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 20
) {
  return this.find({ followingId: userId })
    .populate("followerId", "username avatar bio")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get following
followSchema.statics.getFollowing = function (
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 20
) {
  return this.find({ followerId: userId })
    .populate("followingId", "username avatar bio")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to check if user follows another
followSchema.statics.isFollowing = function (
  followerId: mongoose.Types.ObjectId,
  followingId: mongoose.Types.ObjectId
) {
  return this.findOne({ followerId, followingId });
};

// Static method to get follow counts
followSchema.statics.getFollowCounts = async function (userId: mongoose.Types.ObjectId) {
  const [followersCount, followingCount] = await Promise.all([
    this.countDocuments({ followingId: userId }),
    this.countDocuments({ followerId: userId }),
  ]);

  return { followersCount, followingCount };
};

export const Follow = mongoose.models.Follow || mongoose.model<IFollow>("Follow", followSchema);
