import mongoose, { Document, Schema } from "mongoose";
import { IBook } from "./Book";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index to prevent duplicate reviews
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Index for book queries
reviewSchema.index({ bookId: 1, createdAt: -1 });

// Post-save hook to update book rating counts
reviewSchema.post<IReview>("save", async function () {
  const Book = mongoose.model("Book");
  await updateBookRatings(this.bookId, Book as mongoose.Model<IBook>);
});

// Post-remove hook to update book rating counts (deprecated, use deleteOne)
reviewSchema.post<IReview>("deleteOne", async function () {
  const Book = mongoose.model("Book");
  await updateBookRatings(this.bookId, Book as mongoose.Model<IBook>);
});

// Helper function to update book ratings
async function updateBookRatings(bookId: mongoose.Types.ObjectId, Book: mongoose.Model<IBook>) {
  const Review = mongoose.model("Review") as mongoose.Model<IReview>;

  const ratingStats = await Review.aggregate([
    { $match: { bookId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const stats = ratingStats[0] || { averageRating: 0, reviewCount: 0 };

  await Book.findByIdAndUpdate(bookId, {
    averageRating: Math.round(stats.averageRating * 100) / 100, // Round to 2 decimal places
    reviewCount: stats.reviewCount,
  });
}

// Static method to get reviews for a book
reviewSchema.statics.getBookReviews = function (
  bookId: mongoose.Types.ObjectId,
  page = 1,
  limit = 10
) {
  return this.find({ bookId })
    .populate("userId", "username avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get user reviews
reviewSchema.statics.getUserReviews = function (
  userId: mongoose.Types.ObjectId,
  page = 1,
  limit = 10
) {
  return this.find({ userId })
    .populate("bookId", "title coverImage")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export const Review = mongoose.model<IReview>("Review", reviewSchema);
