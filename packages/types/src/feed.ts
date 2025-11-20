import { z } from "zod";

export const ActivityTypeSchema = z.enum([
  "book_published",
  "review_created",
  "follow_created",
  "follow_removed",
  "story_published",
  "draft_created",
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const FeedActivitySchema = z.object({
  _id: z.string(),
  userId: z.string(),
  activityType: ActivityTypeSchema,
  targetId: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type FeedActivity = z.infer<typeof FeedActivitySchema>;
