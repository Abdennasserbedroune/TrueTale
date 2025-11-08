import { z } from "zod";

const bookStatusEnum = z.enum(["draft", "published"]);

const queryNumberSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const parsedValue = typeof value === "string" ? Number(value) : value;
    return Number.isNaN(parsedValue) ? Number.NaN : parsedValue;
  });

export const paginationQuerySchema = z
  .object({
    page: queryNumberSchema,
    limit: queryNumberSchema,
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
  }))
  .refine((value) => Number.isInteger(value.page) && value.page >= 1, {
    message: "Page must be a positive integer",
    path: ["page"],
  })
  .refine((value) => Number.isInteger(value.limit) && value.limit >= 1 && value.limit <= 50, {
    message: "Limit must be between 1 and 50",
    path: ["limit"],
  });

const genresSchema = z.array(z.string().min(1).max(50)).min(1).max(10);

export const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  price: z.number().min(0),
  coverImage: z.string().url().optional(),
  status: bookStatusEnum.optional(),
  genres: genresSchema,
  language: z.string().min(1).max(60),
  pages: z.number().int().min(1),
});

export const updateBookSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    category: z.string().min(1).max(100).optional(),
    price: z.number().min(0).optional(),
    coverImage: z.string().url().optional(),
    status: bookStatusEnum.optional(),
    genres: genresSchema.optional(),
    language: z.string().min(1).max(60).optional(),
    pages: z.number().int().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const createDraftSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export const updateDraftSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const createStorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().optional(),
});

export const updateProfileSchema = z
  .object({
    profile: z.string().max(200).optional(),
    bio: z.string().max(1000).optional(),
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

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
