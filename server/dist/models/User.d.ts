import mongoose, { Document } from "mongoose";
export type UserRole = "writer" | "reader";
export interface SocialLinks {
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
}
export interface IUser extends Document {
    email: string;
    username: string;
    password: string;
    role: UserRole;
    profile?: string;
    bio?: string;
    avatar?: string;
    socials?: SocialLinks;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map