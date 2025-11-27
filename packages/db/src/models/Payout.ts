export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed";

export interface Payout {
  id: string;
  seller_id: string; // UUID
  stripe_payout_id?: string;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  order_ids: string[]; // Array of UUIDs
  created_at: string;
  paid_at?: string; // Timestamptz
  updated_at: string;
}
