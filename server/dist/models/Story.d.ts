import mongoose, { Document } from "mongoose";
export interface IStory extends Document {
    writerId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Story: mongoose.Model<IStory, {}, {}, {}, mongoose.Document<unknown, {}, IStory, {}, {}> & IStory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Story.d.ts.map