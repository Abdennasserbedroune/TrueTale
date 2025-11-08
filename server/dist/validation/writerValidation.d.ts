import { z } from "zod";
export declare const paginationQuerySchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<number | undefined, string | number | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<number | undefined, string | number | undefined>>;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
}, {
    page: number | undefined;
    limit: number | undefined;
}>>;
export declare const createBookSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    price: z.ZodNumber;
    coverImage: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>>;
    genres: z.ZodArray<z.ZodString>;
    language: z.ZodString;
    pages: z.ZodNumber;
}, z.core.$strip>;
export declare const updateBookSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    coverImage: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
    }>>;
    genres: z.ZodOptional<z.ZodArray<z.ZodString>>;
    language: z.ZodOptional<z.ZodString>;
    pages: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const createDraftSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export declare const updateDraftSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createStorySchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    published: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    profile: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    socials: z.ZodOptional<z.ZodObject<{
        website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        twitter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        instagram: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        facebook: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        tiktok: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        youtube: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
//# sourceMappingURL=writerValidation.d.ts.map