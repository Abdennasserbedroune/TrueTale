import mongoose, { Document } from "mongoose";
export type BookStatus = "draft" | "published";
export interface IBook extends Document {
    title: string;
    description: string;
    writerId: mongoose.Types.ObjectId;
    category: string;
    price: number;
    coverImage?: string;
    status: BookStatus;
    genres: string[];
    language: string;
    pages: number;
    averageRating: number;
    reviewCount: number;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Book: mongoose.Model<IBook, {}, {}, {}, mongoose.Document<unknown, {}, IBook, {}, {}> & IBook & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Book.d.ts.map