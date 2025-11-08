"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email address" }),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(30, { message: "Username must not exceed 30 characters" })
        .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Username can only contain letters, numbers, hyphens, and underscores",
    }),
    password: zod_1.z
        .string()
        .min(6, { message: "Password must be at least 6 characters" })
        .max(100, { message: "Password must not exceed 100 characters" }),
    role: zod_1.z.enum(["writer", "reader"]).optional(),
    profile: zod_1.z.string().optional(),
    bio: zod_1.z.string().max(500, { message: "Bio must not exceed 500 characters" }).optional(),
    avatar: zod_1.z.string().url({ message: "Avatar must be a valid URL" }).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z.string().min(1, { message: "Password is required" }),
});
//# sourceMappingURL=authValidation.js.map