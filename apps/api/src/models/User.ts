import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export type UserRole = "writer" | "reader";

export interface SocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export interface NotificationPreferences {
  emailUpdates?: boolean;
  newFollowers?: boolean;
  bookReviews?: boolean;
  orderNotifications?: boolean;
}

export interface PayoutSettings {
  frequency: "daily" | "weekly" | "monthly";
  minimumThreshold: number;
}

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  name?: string;
  profile?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  socials?: SocialLinks;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetToken?: string;
  resetExpires?: Date;
  refreshTokens: Array<{ token: string; expiresAt: Date }>;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  payoutSettings?: PayoutSettings;
  notificationPreferences?: NotificationPreferences;
  deletionRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["writer", "reader"],
      default: "reader",
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    profile: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    socials: {
      website: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    stripeAccountId: {
      type: String,
      trim: true,
    },
    stripeOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    payoutSettings: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      minimumThreshold: {
        type: Number,
        default: 5000,
      },
    },
    notificationPreferences: {
      emailUpdates: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      bookReviews: { type: Boolean, default: true },
      orderNotifications: { type: Boolean, default: true },
    },
    deletionRequestedAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationToken: {
      type: String,
    },
    verificationExpires: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    resetExpires: {
      type: Date,
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// Indexes for verification and reset tokens
userSchema.index({ verificationToken: 1, verificationExpires: 1 });
userSchema.index({ resetToken: 1, resetExpires: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
