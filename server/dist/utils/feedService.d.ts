import { ClientSession } from "mongoose";
import { ActivityType } from "../models/FeedActivity";
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
export declare class FeedService {
    record(activityType: ActivityType, payload: FeedRecordPayload, session?: ClientSession): Promise<void>;
    getPersonalFeed(userId: string, options?: FeedQueryOptions): Promise<{
        activities: SerializedFeedItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getGlobalFeed(options?: FeedQueryOptions): Promise<{
        activities: SerializedFeedItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    private serializeActivities;
}
//# sourceMappingURL=feedService.d.ts.map