import { z } from "zod";
export declare const paginationQuerySchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>>;
export declare const browseBooksQuerySchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    genre: z.ZodOptional<z.ZodString>;
    writerId: z.ZodOptional<z.ZodString>;
    minRating: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxRating: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    sort: z.ZodOptional<z.ZodEnum<{
        recent: "recent";
        rating_desc: "rating_desc";
        rating_asc: "rating_asc";
        price_desc: "price_desc";
        price_asc: "price_asc";
    }>>;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
    search: string | undefined;
    category: string | undefined;
    genre: string | undefined;
    writerId: string | undefined;
    minRating: number | undefined;
    maxRating: number | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sort: "recent" | "rating_desc" | "rating_asc" | "price_desc" | "price_asc";
}, {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    category?: string | undefined;
    genre?: string | undefined;
    writerId?: string | undefined;
    minRating?: number | undefined;
    maxRating?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sort?: "recent" | "rating_desc" | "rating_asc" | "price_desc" | "price_asc" | undefined;
}>>;
export declare const reviewMutationSchema: z.ZodObject<{
    rating: z.ZodCoercedNumber<unknown>;
    reviewText: z.ZodString;
}, z.core.$strip>;
export declare const updateReviewSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    reviewText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const readerProfileUpdateSchema: z.ZodObject<{
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
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type BrowseBooksQueryInput = z.infer<typeof browseBooksQuerySchema>;
export type ReviewMutationInput = z.infer<typeof reviewMutationSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReaderProfileUpdateInput = z.infer<typeof readerProfileUpdateSchema>;
//# sourceMappingURL=readerValidation.d.ts.map