import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80),
  bio: z
    .string()
    .max(600)
    .optional()
    .transform((value) => value ?? undefined),
  location: z
    .string()
    .max(120)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  website: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  genres: z
    .array(z.string().min(2).max(32))
    .max(8)
    .optional()
    .default([]),
  avatarUrl: z
    .string()
    .url("Avatar must be a valid URL")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
