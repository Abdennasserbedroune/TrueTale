import { z } from "zod";
export declare const marketplacePaginationSchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>>;
export declare const marketplaceSearchSchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    q: z.ZodString;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
    q: string;
}, {
    q: string;
    page?: number | undefined;
    limit?: number | undefined;
}>>;
export declare const marketplaceFilterSchema: z.ZodPipe<z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    category: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    minRating: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    language: z.ZodOptional<z.ZodString>;
    publishedAfter: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    publishedBefore: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    sort: z.ZodOptional<z.ZodEnum<{
        newest: "newest";
        "most-reviewed": "most-reviewed";
        "highest-rated": "highest-rated";
        "price-asc": "price-asc";
        "price-desc": "price-desc";
    }>>;
}, z.core.$strip>, z.ZodTransform<{
    page: number;
    limit: number;
    category: string | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    minRating: number | undefined;
    language: string | undefined;
    publishedAfter: Date | undefined;
    publishedBefore: Date | undefined;
    sort: "newest" | "most-reviewed" | "highest-rated" | "price-asc" | "price-desc";
}, {
    page?: number | undefined;
    limit?: number | undefined;
    category?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    minRating?: number | undefined;
    language?: string | undefined;
    publishedAfter?: Date | undefined;
    publishedBefore?: Date | undefined;
    sort?: "newest" | "most-reviewed" | "highest-rated" | "price-asc" | "price-desc" | undefined;
}>>;
export declare const marketplaceTrendingSchema: z.ZodPipe<z.ZodObject<{
    days: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>, z.ZodTransform<{
    days: number;
    limit: number;
}, {
    days?: number | undefined;
    limit?: number | undefined;
}>>;
export type MarketplacePaginationInput = z.infer<typeof marketplacePaginationSchema>;
export type MarketplaceSearchInput = z.infer<typeof marketplaceSearchSchema>;
export type MarketplaceFilterInput = z.infer<typeof marketplaceFilterSchema>;
export type MarketplaceTrendingInput = z.infer<typeof marketplaceTrendingSchema>;
//# sourceMappingURL=marketplaceValidation.d.ts.map