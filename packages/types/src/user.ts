import { z } from "zod";

export const UserRoleSchema = z.enum(["writer", "reader"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SocialLinksSchema = z.object({
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
});
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const UserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must not exceed 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Username can only contain letters, numbers, hyphens, and underscores",
    }),
  password: z.string(),
  role: UserRoleSchema,
  profile: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters" }).optional(),
  avatar: z.string().optional(),
  socials: SocialLinksSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must not exceed 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Username can only contain letters, numbers, hyphens, and underscores",
    }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must not exceed 100 characters" }),
  role: UserRoleSchema.optional(),
  profile: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters" }).optional(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type LoginInput = z.infer<typeof LoginSchema>;
