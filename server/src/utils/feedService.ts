import { ClientSession } from "mongoose";
import { ActivityType } from "../models/FeedActivity";

export interface FeedRecordPayload {
  userId: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export class FeedService {
  async record(
    activityType: ActivityType,
    payload: FeedRecordPayload,
    session?: ClientSession
  ): Promise<void> {
    void activityType;
    void payload;
    void session;
  }
}
