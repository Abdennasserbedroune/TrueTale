import mongoose, { Document, Schema } from "mongoose";

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

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    writerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    genres: {
      type: [String],
      required: true,
      validate: {
        validator: function (genres: string[]) {
          return genres.length > 0 && genres.length <= 10;
        },
        message: "A book must have between 1 and 10 genres",
      },
    },
    language: {
      type: String,
      required: true,
      trim: true,
      default: "English",
    },
    pages: {
      type: Number,
      required: true,
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
bookSchema.index({ status: 1, publishedAt: -1 });
bookSchema.index({ price: 1 });
bookSchema.index({ price: -1 });

// Text search index for title and description
bookSchema.index({ title: "text", description: "text" });

// Pre-save hook to set publishedAt when status changes to published
bookSchema.pre<IBook>("save", function (next) {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Book = mongoose.model<IBook>("Book", bookSchema);
