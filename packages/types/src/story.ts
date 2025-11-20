import { z } from "zod";

export const StorySchema = z.object({
  _id: z.string(),
  writerId: z.string(),
  title: z.string().max(200),
  content: z.string(),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Story = z.infer<typeof StorySchema>;

export const CreateStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().default(false),
});
export type CreateStoryInput = z.infer<typeof CreateStorySchema>;

export const UpdateStorySchema = CreateStorySchema.partial();
export type UpdateStoryInput = z.infer<typeof UpdateStorySchema>;
