import { z } from "zod";

export const BookStatusSchema = z.enum(["draft", "published"]);
export type BookStatus = z.infer<typeof BookStatusSchema>;

export const BookSchema = z.object({
  _id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  writerId: z.string(),
  category: z.string(),
  price: z.number().min(0),
  coverImage: z.string().optional(),
  status: BookStatusSchema,
  genres: z.array(z.string()).min(1).max(10),
  language: z.string(),
  pages: z.number().min(1),
  averageRating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().min(0).default(0),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Book = z.infer<typeof BookSchema>;

export const CreateBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be non-negative"),
  coverImage: z.string().url().optional(),
  genres: z.array(z.string()).min(1, "At least one genre is required").max(10),
  language: z.string().default("English"),
  pages: z.number().min(1, "Pages must be at least 1"),
});
export type CreateBookInput = z.infer<typeof CreateBookSchema>;

export const UpdateBookSchema = CreateBookSchema.partial();
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
