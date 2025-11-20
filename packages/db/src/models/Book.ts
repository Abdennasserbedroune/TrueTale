import mongoose, { Document, Schema } from "mongoose";

export type BookStatus = "draft" | "published";
export type BookVisibility = "public" | "private" | "unlisted";
export type BookFileType = "pdf" | "epub" | "mobi" | "sample";
export type BookCurrency = "USD" | "EUR" | "GBP";

export interface IBookFile {
  _id: string;
  type: BookFileType;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface IBook extends Document {
  // Core fields
  authorId: mongoose.Types.ObjectId; // Renamed from writerId for consistency with ticket
  title: string;
  slug: string;
  description: string;
  
  // Media
  coverUrl?: string;
  
  // Pricing
  priceCents: number; // Changed from price to priceCents
  currency: BookCurrency;
  
  // Status & visibility
  isDraft: boolean; // New field
  visibility: BookVisibility; // New field
  
  // Categorization
  tags: string[]; // Changed from genres
  
  // Files
  files: IBookFile[];
  
  // Stats
  stats: {
    views: number;
    sales: number;
  };
  
  // Legacy fields (kept for backward compatibility)
  coverImage?: string; // Legacy field, mapped to coverUrl
  category?: string;
  status: BookStatus; // Keep for backward compatibility
  genres?: string[]; // Keep for backward compatibility
  language?: string;
  pages?: number;
  averageRating: number;
  reviewCount: number;
  publishedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const bookFileSchema = new Schema<IBookFile>(
  {
    _id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["pdf", "epub", "mobi", "sample"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookSchema = new Schema<IBook>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    coverUrl: {
      type: String,
      trim: true,
    },
    priceCents: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      default: "USD",
    },
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "private",
    },
    tags: {
      type: [String],
      default: [],
    },
    files: {
      type: [bookFileSchema],
      default: [],
    },
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      sales: {
        type: Number,
        default: 0,
      },
    },
    // Legacy fields for backward compatibility
    coverImage: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    genres: {
      type: [String],
    },
    language: {
      type: String,
      trim: true,
      default: "English",
    },
    pages: {
      type: Number,
      min: 1,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
bookSchema.index({ authorId: 1, createdAt: -1 });
bookSchema.index({ tags: 1 });
bookSchema.index({ isDraft: 1, visibility: 1 });
bookSchema.index({ status: 1, publishedAt: -1 });
bookSchema.index({ priceCents: 1 });
bookSchema.index({ priceCents: -1 });
bookSchema.index({ status: 1, averageRating: -1 });
bookSchema.index({ status: 1, reviewCount: -1 });
bookSchema.index({ status: 1, category: 1, publishedAt: -1 });
bookSchema.index({ status: 1, language: 1, publishedAt: -1 });

// Text search index for title and description
bookSchema.index({ title: "text", description: "text" });

// Pre-save hook to sync status with isDraft and set publishedAt
bookSchema.pre<IBook>("save", function (next) {
  // Sync status with isDraft for backward compatibility
  if (this.isModified("isDraft")) {
    this.status = this.isDraft ? "draft" : "published";
  }
  if (this.isModified("status")) {
    this.isDraft = this.status === "draft";
  }
  
  // Set publishedAt when book is published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.isModified("isDraft") && !this.isDraft && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

export const Book = mongoose.model<IBook>("Book", bookSchema);
