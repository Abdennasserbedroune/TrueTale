import mongoose, { Document } from "mongoose";
export type ActivityType = "book_published" | "review_created" | "follow_created" | "follow_removed" | "story_published" | "draft_created";
export interface IFeedActivity extends Document {
    userId: mongoose.Types.ObjectId;
    activityType: ActivityType;
    targetId: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FeedActivity: mongoose.Model<IFeedActivity, {}, {}, {}, mongoose.Document<unknown, {}, IFeedActivity, {}, {}> & IFeedActivity & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FeedActivity.d.ts.map