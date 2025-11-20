import mongoose, { Document, Schema } from "mongoose";

export type PayoutStatus = "pending" | "in_transit" | "paid" | "failed";

export interface IPayout extends Document {
  sellerId: mongoose.Types.ObjectId;
  stripePayoutId?: string;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  orderIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  paidAt?: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripePayoutId: {
      type: String,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "in_transit", "paid", "failed"],
      default: "pending",
    },
    orderIds: {
      type: [Schema.Types.ObjectId],
      ref: "Order",
      default: [],
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ sellerId: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

export const Payout = mongoose.model<IPayout>("Payout", payoutSchema);
