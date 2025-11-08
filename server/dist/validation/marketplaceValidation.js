"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceTrendingSchema = exports.marketplaceFilterSchema = exports.marketplaceSearchSchema = exports.marketplacePaginationSchema = void 0;
const zod_1 = require("zod");
const basePaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
});
exports.marketplacePaginationSchema = basePaginationSchema.transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
}));
exports.marketplaceSearchSchema = basePaginationSchema
    .extend({
    q: zod_1.z
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
exports.marketplaceFilterSchema = basePaginationSchema
    .extend({
    category: zod_1.z.string().trim().min(1).max(100).optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    minRating: zod_1.z.coerce.number().min(1).max(5).optional(),
    language: zod_1.z.string().trim().min(1).max(50).optional(),
    publishedAfter: zod_1.z.coerce.date().optional(),
    publishedBefore: zod_1.z.coerce.date().optional(),
    sort: zod_1.z.enum([
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
            code: zod_1.z.ZodIssueCode.custom,
            message: "minPrice cannot be greater than maxPrice",
            path: ["minPrice"],
        });
    }
    if (value.publishedAfter && value.publishedBefore && value.publishedAfter > value.publishedBefore) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "publishedAfter cannot be greater than publishedBefore",
            path: ["publishedAfter"],
        });
    }
});
exports.marketplaceTrendingSchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().min(1).max(365).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
}).transform((value) => ({
    days: value.days ?? 30,
    limit: value.limit ?? 20,
}));
//# sourceMappingURL=marketplaceValidation.js.map