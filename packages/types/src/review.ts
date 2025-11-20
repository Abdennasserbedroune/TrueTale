import { z } from "zod";

export const ReviewSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(1000),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must not exceed 5"),
  reviewText: z.string().min(1, "Review text is required").max(1000, "Review must not exceed 1000 characters"),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
