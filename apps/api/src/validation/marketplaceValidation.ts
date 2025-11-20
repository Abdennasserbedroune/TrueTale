import { z } from "zod";

const basePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const marketplacePaginationSchema = basePaginationSchema.transform((value) => ({
  page: value.page ?? 1,
  limit: value.limit ?? 10,
}));

export const marketplaceSearchSchema = basePaginationSchema
  .extend({
    q: z
      .string()
      .trim()
      .min(1, { message: "Search query is required" })
      .max(200, { message: "Search query must be 200 characters or less" }),
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    q: value.q,
  }));

export const marketplaceFilterSchema = basePaginationSchema
  .extend({
    category: z.string().trim().min(1).max(100).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    language: z.string().trim().min(1).max(50).optional(),
    publishedAfter: z.coerce.date().optional(),
    publishedBefore: z.coerce.date().optional(),
    sort: z.enum([
      "newest",
      "most-reviewed",
      "highest-rated",
      "price-asc",
      "price-desc",
    ]).optional(),
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    category: value.category,
    minPrice: value.minPrice,
    maxPrice: value.maxPrice,
    minRating: value.minRating,
    language: value.language,
    publishedAfter: value.publishedAfter,
    publishedBefore: value.publishedBefore,
    sort: value.sort ?? "newest",
  }))
  .superRefine((value, ctx) => {
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice cannot be greater than maxPrice",
        path: ["minPrice"],
      });
    }

    if (value.publishedAfter && value.publishedBefore && value.publishedAfter > value.publishedBefore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publishedAfter cannot be greater than publishedBefore",
        path: ["publishedAfter"],
      });
    }
  });

export const marketplaceTrendingSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
}).transform((value) => ({
  days: value.days ?? 30,
  limit: value.limit ?? 20,
}));

export type MarketplacePaginationInput = z.infer<typeof marketplacePaginationSchema>;
export type MarketplaceSearchInput = z.infer<typeof marketplaceSearchSchema>;
export type MarketplaceFilterInput = z.infer<typeof marketplaceFilterSchema>;
export type MarketplaceTrendingInput = z.infer<typeof marketplaceTrendingSchema>;