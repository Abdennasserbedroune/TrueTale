import { getSupabaseClient } from "../config/supabaseClient";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface Payout {
  id: string;
  seller_id: string;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  stripe_payout_id: string | null;
  order_ids: string[];
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutCreateData {
  seller_id: string;
  amount_cents: number;
  currency?: string;
  status?: PayoutStatus;
  stripe_payout_id?: string;
  order_ids?: string[];
}

export interface PayoutUpdateData {
  status?: PayoutStatus;
  stripe_payout_id?: string;
  failure_reason?: string;
  processed_at?: string;
}

export class PayoutRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Payout | null> {
    const { data, error } = await this.supabase.from("payouts").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Payout;
  }

  async findBySeller(
    sellerId: string,
    options: { status?: PayoutStatus; limit?: number; offset?: number } = {}
  ): Promise<{ payouts: Payout[]; total: number }> {
    let query = this.supabase
      .from("payouts")
      .select("*", { count: "exact" })
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (options.status) {
      query = query.eq("status", options.status);
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
      payouts: (data || []) as Payout[],
      total: count || 0,
    };
  }

  async create(payoutData: PayoutCreateData): Promise<Payout> {
    const { data, error } = await this.supabase
      .from("payouts")
      .insert({
        seller_id: payoutData.seller_id,
        amount_cents: payoutData.amount_cents,
        currency: payoutData.currency || "USD",
        status: payoutData.status || "pending",
        stripe_payout_id: payoutData.stripe_payout_id || null,
        order_ids: payoutData.order_ids || [],
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create payout");
    }

    return data as Payout;
  }

  async update(id: string, updateData: PayoutUpdateData): Promise<Payout> {
    const { data, error } = await this.supabase.from("payouts").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update payout");
    }

    return data as Payout;
  }

  async getTotalPaidOut(sellerId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("payouts")
      .select("amount_cents")
      .eq("seller_id", sellerId)
      .eq("status", "completed");

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).reduce((sum, payout) => sum + payout.amount_cents, 0);
  }

  async getPendingAmount(sellerId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("payouts")
      .select("amount_cents")
      .eq("seller_id", sellerId)
      .in("status", ["pending", "processing"]);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).reduce((sum, payout) => sum + payout.amount_cents, 0);
  }
}
