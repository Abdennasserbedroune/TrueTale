"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const reviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bookId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Unique compound index to prevent duplicate reviews
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
// Index for book queries
reviewSchema.index({ bookId: 1, createdAt: -1 });
// Post-save hook to update book rating counts
reviewSchema.post("save", async function () {
    const Book = mongoose_1.default.model("Book");
    await updateBookRatings(this.bookId, Book);
});
// Post-remove hook to update book rating counts
reviewSchema.post("remove", async function () {
    const Book = mongoose_1.default.model("Book");
    await updateBookRatings(this.bookId, Book);
});
// Helper function to update book ratings
async function updateBookRatings(bookId, Book) {
    const Review = mongoose_1.default.model("Review");
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
reviewSchema.statics.getBookReviews = function (bookId, page = 1, limit = 10) {
    return this.find({ bookId })
        .populate("userId", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};
// Static method to get user reviews
reviewSchema.statics.getUserReviews = function (userId, page = 1, limit = 10) {
    return this.find({ userId })
        .populate("bookId", "title coverImage")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};
exports.Review = mongoose_1.default.model("Review", reviewSchema);
//# sourceMappingURL=Review.js.map