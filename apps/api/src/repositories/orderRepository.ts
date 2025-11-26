import { getSupabaseClient } from "../config/supabaseClient";

export interface Order {
  id: string;
  user_id: string;
  book_id: string;
  writer_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  seller_proceeds_cents: number;
  status: "pending" | "paid" | "failed" | "refunded";
  download_url: string | null;
  download_url_expires: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreateData {
  user_id: string;
  book_id: string;
  writer_id: string;
  stripe_payment_intent_id?: string;
  amount_cents: number;
  currency?: string;
  platform_fee_cents?: number;
  seller_proceeds_cents: number;
  status?: "pending" | "paid" | "failed" | "refunded";
  download_url?: string;
  download_url_expires?: string;
}

export interface OrderUpdateData {
  stripe_payment_intent_id?: string;
  status?: "pending" | "paid" | "failed" | "refunded";
  download_url?: string;
  download_url_expires?: string;
}

export class OrderRepository {
  private supabase = getSupabaseClient();

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase.from("orders").select("*").eq("id", id).single();

    if (error || !data) {
      return null;
    }

    return data as Order;
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Order;
  }

  async findByUser(userId: string, options: { limit?: number; offset?: number } = {}): Promise<{ orders: Order[]; total: number }> {
    let query = this.supabase
      .from("orders")
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
      orders: (data || []) as Order[],
      total: count || 0,
    };
  }

  async findByWriter(
    writerId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    let query = this.supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("writer_id", writerId)
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
      orders: (data || []) as Order[],
      total: count || 0,
    };
  }

  async checkExistingPurchase(userId: string, bookId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("status", "paid")
      .limit(1)
      .single();

    return !error && !!data;
  }

  async create(orderData: OrderCreateData): Promise<Order> {
    const { data, error } = await this.supabase
      .from("orders")
      .insert({
        user_id: orderData.user_id,
        book_id: orderData.book_id,
        writer_id: orderData.writer_id,
        stripe_payment_intent_id: orderData.stripe_payment_intent_id || null,
        amount_cents: orderData.amount_cents,
        currency: orderData.currency || "USD",
        platform_fee_cents: orderData.platform_fee_cents || 0,
        seller_proceeds_cents: orderData.seller_proceeds_cents,
        status: orderData.status || "pending",
        download_url: orderData.download_url || null,
        download_url_expires: orderData.download_url_expires || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create order");
    }

    return data as Order;
  }

  async update(id: string, updateData: OrderUpdateData): Promise<Order> {
    const { data, error } = await this.supabase.from("orders").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update order");
    }

    return data as Order;
  }

  async getTotalRevenue(writerId: string, status: string = "paid"): Promise<number> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("seller_proceeds_cents")
      .eq("writer_id", writerId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).reduce((sum, order) => sum + order.seller_proceeds_cents, 0);
  }

  async getMonthlyRevenue(writerId: string, monthStart: Date): Promise<number> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("seller_proceeds_cents")
      .eq("writer_id", writerId)
      .eq("status", "paid")
      .gte("created_at", monthStart.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).reduce((sum, order) => sum + order.seller_proceeds_cents, 0);
  }

  async countByWriter(writerId: string, status: string = "paid"): Promise<number> {
    const { count, error } = await this.supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("writer_id", writerId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }
}
