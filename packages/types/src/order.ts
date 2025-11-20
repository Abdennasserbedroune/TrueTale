import { z } from "zod";

export const OrderStatusSchema = z.enum(["pending", "paid", "refunded"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  writerId: z.string(),
  price: z.number().min(0),
  status: OrderStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const IdParamsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
export type IdParams = z.infer<typeof IdParamsSchema>;
