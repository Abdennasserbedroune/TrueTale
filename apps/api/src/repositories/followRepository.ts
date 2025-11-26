import { getSupabaseClient } from "../config/supabaseClient";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowWithUser extends Follow {
  follower?: {
    id: string;
    username: string;
    avatar: string | null;
    bio: string | null;
  };
  following?: {
    id: string;
    username: string;
    avatar: string | null;
    bio: string | null;
  };
}

export class FollowRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Follow | null> {
    const { data, error } = await this.supabase.from("follows").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Follow;
  }

  async findByFollowerAndFollowing(followerId: string, followingId: string): Promise<Follow | null> {
    const { data, error } = await this.supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Follow;
  }

  async checkFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.findByFollowerAndFollowing(followerId, followingId);
    return !!follow;
  }

  async getFollowers(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ followers: FollowWithUser[]; total: number }> {
    let query = this.supabase
      .from("follows")
      .select(
        `
        *,
        follower:users!follows_follower_id_fkey (
          id,
          username,
          avatar,
          bio
        )
      `,
        { count: "exact" }
      )
      .eq("following_id", userId)
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
      followers: (data || []) as FollowWithUser[],
      total: count || 0,
    };
  }

  async getFollowing(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ following: FollowWithUser[]; total: number }> {
    let query = this.supabase
      .from("follows")
      .select(
        `
        *,
        following:users!follows_following_id_fkey (
          id,
          username,
          avatar,
          bio
        )
      `,
        { count: "exact" }
      )
      .eq("follower_id", userId)
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
      following: (data || []) as FollowWithUser[],
      total: count || 0,
    };
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => row.following_id);
  }

  async create(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    const { data, error } = await this.supabase
      .from("follows")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        throw new Error("Already following this user");
      }
      throw new Error(error?.message || "Failed to create follow");
    }

    return data as Follow;
  }

  async delete(followerId: string, followingId: string): Promise<void> {
    const { error } = await this.supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      throw new Error(error.message || "Failed to delete follow");
    }
  }

  async countFollowers(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  async countFollowing(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }
}
