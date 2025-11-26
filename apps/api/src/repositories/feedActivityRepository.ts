import { getSupabaseClient } from "../config/supabaseClient";

export type ActivityType = "book_published" | "story_published" | "review_created" | "follow_created" | "follow_removed";

export interface FeedActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FeedActivityWithUser extends FeedActivity {
  user?: {
    id: string;
    username: string;
    avatar: string | null;
    role: string;
  };
}

export interface FeedActivityCreateData {
  user_id: string;
  activity_type: ActivityType;
  metadata?: Record<string, any>;
}

export class FeedActivityRepository {
  private supabase = getSupabaseClient();

  async create(activityData: FeedActivityCreateData): Promise<FeedActivity> {
    const { data, error } = await this.supabase
      .from("feed_activities")
      .insert({
        user_id: activityData.user_id,
        activity_type: activityData.activity_type,
        metadata: activityData.metadata || {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create activity");
    }

    return data as FeedActivity;
  }

  async getPersonalFeed(
    userId: string,
    followingIds: string[],
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ activities: FeedActivityWithUser[]; total: number }> {
    if (followingIds.length === 0) {
      return { activities: [], total: 0 };
    }

    let query = this.supabase
      .from("feed_activities")
      .select(
        `
        *,
        user:users!feed_activities_user_id_fkey (
          id,
          username,
          avatar,
          role
        )
      `,
        { count: "exact" }
      )
      .in("user_id", followingIds)
      .order("created_at", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      activities: (data || []) as FeedActivityWithUser[],
      total: count || 0,
    };
  }

  async getGlobalFeed(
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ activities: FeedActivityWithUser[]; total: number }> {
    let query = this.supabase
      .from("feed_activities")
      .select(
        `
        *,
        user:users!feed_activities_user_id_fkey (
          id,
          username,
          avatar,
          role
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      activities: (data || []) as FeedActivityWithUser[],
      total: count || 0,
    };
  }

  async deleteByUser(userId: string): Promise<void> {
    const { error } = await this.supabase.from("feed_activities").delete().eq("user_id", userId);

    if (error) {
      throw new Error(error.message || "Failed to delete activities");
    }
  }
}
