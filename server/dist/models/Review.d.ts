import mongoose, { Document } from "mongoose";
export interface IReview extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: mongoose.Types.ObjectId;
    rating: number;
    reviewText: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Review.d.ts.map