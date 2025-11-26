import { getSupabaseClient } from "../config/supabaseClient";

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends Review {
  user?: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface ReviewCreateData {
  user_id: string;
  book_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateData {
  rating?: number;
  comment?: string;
}

export class ReviewRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Review | null> {
    const { data, error } = await this.supabase.from("reviews").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Review;
  }

  async findByUserAndBook(userId: string, bookId: string): Promise<Review | null> {
    const { data, error } = await this.supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Review;
  }

  async findByBook(
    bookId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ reviews: ReviewWithUser[]; total: number }> {
    let query = this.supabase
      .from("reviews")
      .select(
        `
        *,
        user:users!reviews_user_id_fkey (
          id,
          username,
          avatar
        )
      `,
        { count: "exact" }
      )
      .eq("book_id", bookId)
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
      reviews: (data || []) as ReviewWithUser[],
      total: count || 0,
    };
  }

  async findByUser(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ reviews: Review[]; total: number }> {
    let query = this.supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
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
      reviews: (data || []) as Review[],
      total: count || 0,
    };
  }

  async create(reviewData: ReviewCreateData): Promise<Review> {
    const { data, error } = await this.supabase
      .from("reviews")
      .insert({
        user_id: reviewData.user_id,
        book_id: reviewData.book_id,
        rating: reviewData.rating,
        comment: reviewData.comment || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create review");
    }

    return data as Review;
  }

  async update(id: string, updateData: ReviewUpdateData): Promise<Review> {
    const { data, error } = await this.supabase.from("reviews").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update review");
    }

    return data as Review;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("reviews").delete().eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete review");
    }
  }

  async getRatingDistribution(bookId: string): Promise<{ rating: number; count: number }[]> {
    const { data, error } = await this.supabase
      .from("reviews")
      .select("rating")
      .eq("book_id", bookId);

    if (error) {
      throw new Error(error.message);
    }

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    (data || []).forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return Object.entries(distribution).map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
    }));
  }
}
