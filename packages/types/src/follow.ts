import { z } from "zod";

export const FollowSchema = z.object({
  _id: z.string(),
  followerId: z.string(),
  followingId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Follow = z.infer<typeof FollowSchema>;
