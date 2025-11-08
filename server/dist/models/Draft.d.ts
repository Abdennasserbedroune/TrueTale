import mongoose, { Document } from "mongoose";
export interface IDraft extends Document {
    writerId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Draft: mongoose.Model<IDraft, {}, {}, {}, mongoose.Document<unknown, {}, IDraft, {}, {}> & IDraft & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Draft.d.ts.map