export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  user_id: string; // UUID
  book_id: string; // UUID
  writer_id: string; // UUID
  price: number;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id?: string;
  status: OrderStatus;
  platform_fee_cents?: number;
  seller_proceeds_cents?: number;
  download_url?: string;
  download_url_expires?: string; // Timestamptz
  created_at: string;
  updated_at: string;
}