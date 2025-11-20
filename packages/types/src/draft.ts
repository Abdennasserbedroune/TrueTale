import { z } from "zod";

export const DraftSchema = z.object({
  _id: z.string(),
  writerId: z.string(),
  title: z.string().max(200),
  content: z.string(),
  wordCount: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Draft = z.infer<typeof DraftSchema>;

export const CreateDraftSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
});
export type CreateDraftInput = z.infer<typeof CreateDraftSchema>;

export const UpdateDraftSchema = CreateDraftSchema.partial();
export type UpdateDraftInput = z.infer<typeof UpdateDraftSchema>;
