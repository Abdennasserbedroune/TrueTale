export type ActivityType =
  | "book_published"
  | "review_created"
  | "follow_created"
  | "follow_removed"
  | "story_published"
  | "draft_created";

export interface FeedActivity {
  id: string;
  user_id: string; // UUID
  activity_type: ActivityType;
  target_id: string; // UUID
  metadata?: Record<string, unknown>; // JSONB
  created_at: string;
  updated_at: string;
}
