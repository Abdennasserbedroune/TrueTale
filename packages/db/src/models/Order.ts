import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  writerId: mongoose.Types.ObjectId;
  price: number;
  amountCents: number;
  currency: string;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  platformFeeCents?: number;
  sellerProceedsCents?: number;
  downloadUrl?: string;
  downloadUrlExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    writerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    platformFeeCents: {
      type: Number,
      min: 0,
    },
    sellerProceedsCents: {
      type: Number,
      min: 0,
    },
    downloadUrl: {
      type: String,
    },
    downloadUrlExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, bookId: 1 }, { unique: true }); // Prevent duplicate orders for same user/book
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ writerId: 1, createdAt: -1 }); // For seller order queries
orderSchema.index({ writerId: 1, status: 1 }); // For seller earnings queries

export const Order = mongoose.model<IOrder>("Order", orderSchema);