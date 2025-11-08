import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const basePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const paginationQuerySchema = basePaginationSchema.transform((value) => ({
  page: value.page ?? 1,
  limit: value.limit ?? 10,
}));

export const browseBooksQuerySchema = basePaginationSchema
  .extend({
    search: z
      .string()
      .trim()
      .min(1, { message: "Search must be at least 1 character" })
      .max(200)
      .optional(),
    category: z.string().trim().min(1).max(100).optional(),
    genre: z.string().trim().min(1).max(100).optional(),
    writerId: z
      .string()
      .trim()
      .regex(objectIdPattern, { message: "Invalid writer id" })
      .optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    maxRating: z.coerce.number().min(1).max(5).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["recent", "rating_desc", "rating_asc", "price_desc", "price_asc"]).optional(),
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    search: value.search,
    category: value.category,
    genre: value.genre,
    writerId: value.writerId,
    minRating: value.minRating,
    maxRating: value.maxRating,
    minPrice: value.minPrice,
    maxPrice: value.maxPrice,
    sort: value.sort ?? "recent",
  }))
  .superRefine((value, ctx) => {
    if (value.minRating !== undefined && value.maxRating !== undefined && value.minRating > value.maxRating) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minRating cannot be greater than maxRating",
        path: ["minRating"],
      });
    }

    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice cannot be greater than maxPrice",
        path: ["minPrice"],
      });
    }
  });

export const reviewMutationSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(1).max(1000),
});

export const updateReviewSchema = reviewMutationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const readerProfileUpdateSchema = z
  .object({
    profile: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(1000).optional(),
    avatar: z.string().url().optional(),
    socials: z
      .object({
        website: z.string().url().optional(),
        twitter: z.string().url().optional(),
        instagram: z.string().url().optional(),
        facebook: z.string().url().optional(),
        tiktok: z.string().url().optional(),
        youtube: z.string().url().optional(),
      })
      .partial()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type BrowseBooksQueryInput = z.infer<typeof browseBooksQuerySchema>;
export type ReviewMutationInput = z.infer<typeof reviewMutationSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReaderProfileUpdateInput = z.infer<typeof readerProfileUpdateSchema>;
