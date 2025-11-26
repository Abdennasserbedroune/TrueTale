import { getSupabaseClient } from "../config/supabaseClient";

export interface Draft {
  id: string;
  writer_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DraftCreateData {
  writer_id: string;
  title: string;
  content?: string;
  tags?: string[];
}

export interface DraftUpdateData {
  title?: string;
  content?: string;
  tags?: string[];
}

export class DraftRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Draft | null> {
    const { data, error } = await this.supabase.from("drafts").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Draft;
  }

  async findByWriter(
    writerId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ drafts: Draft[]; total: number }> {
    let query = this.supabase
      .from("drafts")
      .select("*", { count: "exact" })
      .eq("writer_id", writerId)
      .order("updated_at", { ascending: false });

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
      drafts: (data || []) as Draft[],
      total: count || 0,
    };
  }

  async create(draftData: DraftCreateData): Promise<Draft> {
    const { data, error } = await this.supabase
      .from("drafts")
      .insert({
        writer_id: draftData.writer_id,
        title: draftData.title,
        content: draftData.content || "",
        tags: draftData.tags || [],
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create draft");
    }

    return data as Draft;
  }

  async update(id: string, updateData: DraftUpdateData): Promise<Draft> {
    const { data, error } = await this.supabase.from("drafts").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update draft");
    }

    return data as Draft;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("drafts").delete().eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete draft");
    }
  }
}
