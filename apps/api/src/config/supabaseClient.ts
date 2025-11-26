import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabase;
}

export type SupabaseDatabase = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          role: "reader" | "writer";
          name: string | null;
          profile: string | null;
          bio: string | null;
          avatar: string | null;
          location: string | null;
          socials: Record<string, string>;
          is_verified: boolean;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          payout_settings: {
            frequency: "daily" | "weekly" | "monthly";
            minimumThreshold: number;
          };
          notification_preferences: {
            emailUpdates: boolean;
            newFollowers: boolean;
            bookReviews: boolean;
            orderNotifications: boolean;
          };
          deletion_requested_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          role?: "reader" | "writer";
          name?: string | null;
          profile?: string | null;
          bio?: string | null;
          avatar?: string | null;
          location?: string | null;
          socials?: Record<string, string>;
          is_verified?: boolean;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          payout_settings?: {
            frequency: "daily" | "weekly" | "monthly";
            minimumThreshold: number;
          };
          notification_preferences?: {
            emailUpdates: boolean;
            newFollowers: boolean;
            bookReviews: boolean;
            orderNotifications: boolean;
          };
          deletion_requested_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          role?: "reader" | "writer";
          name?: string | null;
          profile?: string | null;
          bio?: string | null;
          avatar?: string | null;
          location?: string | null;
          socials?: Record<string, string>;
          is_verified?: boolean;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          payout_settings?: {
            frequency: "daily" | "weekly" | "monthly";
            minimumThreshold: number;
          };
          notification_preferences?: {
            emailUpdates: boolean;
            newFollowers: boolean;
            bookReviews: boolean;
            orderNotifications: boolean;
          };
          deletion_requested_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          description: string;
          cover_url: string | null;
          price_cents: number;
          currency: string;
          is_draft: boolean;
          status: string;
          visibility: string;
          tags: string[];
          category: string | null;
          language: string;
          pages: number | null;
          average_rating: number;
          review_count: number;
          views: number;
          sales: number;
          published_at: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          description?: string;
          cover_url?: string | null;
          price_cents?: number;
          currency?: string;
          is_draft?: boolean;
          status?: string;
          visibility?: string;
          tags?: string[];
          category?: string | null;
          language?: string;
          pages?: number | null;
          average_rating?: number;
          review_count?: number;
          views?: number;
          sales?: number;
          published_at?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          description?: string;
          cover_url?: string | null;
          price_cents?: number;
          currency?: string;
          is_draft?: boolean;
          status?: string;
          visibility?: string;
          tags?: string[];
          category?: string | null;
          language?: string;
          pages?: number | null;
          average_rating?: number;
          review_count?: number;
          views?: number;
          sales?: number;
          published_at?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_files: {
        Row: {
          id: string;
          book_id: string;
          file_type: string;
          url: string;
          size: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          file_type: string;
          url: string;
          size: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          file_type?: string;
          url?: string;
          size?: number;
          uploaded_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          writer_id: string;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          platform_fee_cents: number;
          seller_proceeds_cents: number;
          status: string;
          download_url: string | null;
          download_url_expires: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          writer_id: string;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          currency?: string;
          platform_fee_cents?: number;
          seller_proceeds_cents: number;
          status?: string;
          download_url?: string | null;
          download_url_expires?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          writer_id?: string;
          stripe_payment_intent_id?: string | null;
          amount_cents?: number;
          currency?: string;
          platform_fee_cents?: number;
          seller_proceeds_cents?: number;
          status?: string;
          download_url?: string | null;
          download_url_expires?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      feed_activities: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      drafts: {
        Row: {
          id: string;
          writer_id: string;
          title: string;
          content: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          writer_id: string;
          title: string;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          writer_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
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
        };
        Insert: {
          id?: string;
          writer_id: string;
          title: string;
          content: string;
          tags?: string[];
          is_published?: boolean;
          views?: number;
          likes?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          writer_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          is_published?: boolean;
          views?: number;
          likes?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          seller_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          stripe_payout_id: string | null;
          order_ids: string[];
          failure_reason: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          stripe_payout_id?: string | null;
          order_ids?: string[];
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          stripe_payout_id?: string | null;
          order_ids?: string[];
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
