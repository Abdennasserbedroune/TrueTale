import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus = "pending" | "paid" | "refunded";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  writerId: mongoose.Types.ObjectId;
  price: number;
  status: OrderStatus;
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
    status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      required: true,
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

export const Order = mongoose.model<IOrder>("Order", orderSchema);