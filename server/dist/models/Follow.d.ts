import mongoose, { Document } from "mongoose";
export interface IFollow extends Document {
    followerId: mongoose.Types.ObjectId;
    followingId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Follow: mongoose.Model<IFollow, {}, {}, {}, mongoose.Document<unknown, {}, IFollow, {}, {}> & IFollow & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Follow.d.ts.map