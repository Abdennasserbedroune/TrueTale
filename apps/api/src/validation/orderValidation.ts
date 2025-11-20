import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});

export const createOrderSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
});

export const idParamsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});