"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createStorySchema = exports.updateDraftSchema = exports.createDraftSchema = exports.updateBookSchema = exports.createBookSchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
const bookStatusEnum = zod_1.z.enum(["draft", "published"]);
const queryNumberSchema = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .optional()
    .transform((value) => {
    if (value === undefined || value === null) {
        return undefined;
    }
    const parsedValue = typeof value === "string" ? Number(value) : value;
    return Number.isNaN(parsedValue) ? Number.NaN : parsedValue;
});
exports.paginationQuerySchema = zod_1.z
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
const genresSchema = zod_1.z.array(zod_1.z.string().min(1).max(50)).min(1).max(10);
exports.createBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    category: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().min(0),
    coverImage: zod_1.z.string().url().optional(),
    status: bookStatusEnum.optional(),
    genres: genresSchema,
    language: zod_1.z.string().min(1).max(60),
    pages: zod_1.z.number().int().min(1),
});
exports.updateBookSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().min(1).max(2000).optional(),
    category: zod_1.z.string().min(1).max(100).optional(),
    price: zod_1.z.number().min(0).optional(),
    coverImage: zod_1.z.string().url().optional(),
    status: bookStatusEnum.optional(),
    genres: genresSchema.optional(),
    language: zod_1.z.string().min(1).max(60).optional(),
    pages: zod_1.z.number().int().min(1).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
exports.createDraftSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    content: zod_1.z.string().min(1),
});
exports.updateDraftSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1).max(200).optional(),
    content: zod_1.z.string().min(1).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
exports.createStorySchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    content: zod_1.z.string().min(1),
    published: zod_1.z.boolean().optional(),
});
exports.updateProfileSchema = zod_1.z
    .object({
    profile: zod_1.z.string().max(200).optional(),
    bio: zod_1.z.string().max(1000).optional(),
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
//# sourceMappingURL=writerValidation.js.map