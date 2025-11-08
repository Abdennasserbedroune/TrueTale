"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readerProfileUpdateSchema = exports.updateReviewSchema = exports.reviewMutationSchema = exports.browseBooksQuerySchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const basePaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
});
exports.paginationQuerySchema = basePaginationSchema.transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
}));
exports.browseBooksQuerySchema = basePaginationSchema
    .extend({
    search: zod_1.z
        .string()
        .trim()
        .min(1, { message: "Search must be at least 1 character" })
        .max(200)
        .optional(),
    category: zod_1.z.string().trim().min(1).max(100).optional(),
    genre: zod_1.z.string().trim().min(1).max(100).optional(),
    writerId: zod_1.z
        .string()
        .trim()
        .regex(objectIdPattern, { message: "Invalid writer id" })
        .optional(),
    minRating: zod_1.z.coerce.number().min(1).max(5).optional(),
    maxRating: zod_1.z.coerce.number().min(1).max(5).optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    sort: zod_1.z.enum(["recent", "rating_desc", "rating_asc", "price_desc", "price_asc"]).optional(),
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
            code: zod_1.z.ZodIssueCode.custom,
            message: "minRating cannot be greater than maxRating",
            path: ["minRating"],
        });
    }
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "minPrice cannot be greater than maxPrice",
            path: ["minPrice"],
        });
    }
});
exports.reviewMutationSchema = zod_1.z.object({
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    reviewText: zod_1.z.string().trim().min(1).max(1000),
});
exports.updateReviewSchema = exports.reviewMutationSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
exports.readerProfileUpdateSchema = zod_1.z
    .object({
    profile: zod_1.z.string().trim().max(200).optional(),
    bio: zod_1.z.string().trim().max(1000).optional(),
    avatar: zod_1.z.string().url().optional(),
    socials: zod_1.z
        .object({
        website: zod_1.z.string().url().optional(),
        twitter: zod_1.z.string().url().optional(),
        instagram: zod_1.z.string().url().optional(),
        facebook: zod_1.z.string().url().optional(),
        tiktok: zod_1.z.string().url().optional(),
        youtube: zod_1.z.string().url().optional(),
    })
        .partial()
        .optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
//# sourceMappingURL=readerValidation.js.map