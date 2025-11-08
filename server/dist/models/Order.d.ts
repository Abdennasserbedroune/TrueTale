import mongoose, { Document } from "mongoose";
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
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Order.d.ts.map