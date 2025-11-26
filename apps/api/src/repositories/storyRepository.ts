import { getSupabaseClient } from "../config/supabaseClient";

export interface Story {
  id: string;
  writer_id: string;
  title: string;
  content: string;
  tags: string[];
  is_published: boolean;
  views: number;
  likes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryWithWriter extends Story {
  writer?: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface StoryCreateData {
  writer_id: string;
  title: string;
  content: string;
  tags?: string[];
  is_published?: boolean;
}

export interface StoryUpdateData {
  title?: string;
  content?: string;
  tags?: string[];
  is_published?: boolean;
  views?: number;
  likes?: number;
}

export class StoryRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Story | null> {
    const { data, error } = await this.supabase.from("stories").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Story;
  }

  async findPublished(
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ stories: StoryWithWriter[]; total: number }> {
    let query = this.supabase
      .from("stories")
      .select(
        `
        *,
        writer:users!stories_writer_id_fkey (
          id,
          username,
          avatar
        )
      `,
        { count: "exact" }
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });

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
      stories: (data || []) as StoryWithWriter[],
      total: count || 0,
    };
  }

  async findByWriter(
    writerId: string,
    options: { includeUnpublished?: boolean; limit?: number; offset?: number } = {}
  ): Promise<{ stories: Story[]; total: number }> {
    let query = this.supabase
      .from("stories")
      .select("*", { count: "exact" })
      .eq("writer_id", writerId)
      .order("updated_at", { ascending: false });

    if (!options.includeUnpublished) {
      query = query.eq("is_published", true);
    }

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
      stories: (data || []) as Story[],
      total: count || 0,
    };
  }

  async create(storyData: StoryCreateData): Promise<Story> {
    const insertData: any = {
      writer_id: storyData.writer_id,
      title: storyData.title,
      content: storyData.content,
      tags: storyData.tags || [],
      is_published: storyData.is_published || false,
    };

    if (storyData.is_published) {
      insertData.published_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase.from("stories").insert(insertData).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create story");
    }

    return data as Story;
  }

  async update(id: string, updateData: StoryUpdateData): Promise<Story> {
    const updates: any = { ...updateData };

    const story = await this.findById(id);
    if (story && !story.is_published && updateData.is_published) {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase.from("stories").update(updates).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update story");
    }

    return data as Story;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("stories").delete().eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete story");
    }
  }

  async incrementViews(id: string): Promise<void> {
    const story = await this.findById(id);
    if (story) {
      await this.update(id, { views: story.views + 1 });
    }
  }

  async incrementLikes(id: string): Promise<void> {
    const story = await this.findById(id);
    if (story) {
      await this.update(id, { likes: story.likes + 1 });
    }
  }

  async decrementLikes(id: string): Promise<void> {
    const story = await this.findById(id);
    if (story && story.likes > 0) {
      await this.update(id, { likes: story.likes - 1 });
    }
  }
}
