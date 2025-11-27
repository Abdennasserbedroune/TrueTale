import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { db } from "@truetale/db";
import { TokenService } from "../utils/tokenService";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/authValidation";
import { EmailService } from "../services/emailService";
import crypto from "crypto";
import bcrypt from "bcrypt";

const REFRESH_TOKEN_COOKIE = "refreshToken";

export function createAuthController(tokenService: TokenService, emailService: EmailService) {
  const register = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors: parseResult.error?.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      // Check if user already exists
      const { data: existingUser } = await db
        .from("users")
        .select("email, username")
        .or(`email.eq.${validatedData.email},username.eq.${validatedData.username}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.email === validatedData.email) {
          res.status(StatusCodes.CONFLICT).json({
            message: "Email already registered",
            status: StatusCodes.CONFLICT,
          });
          return;
        }
        if (existingUser.username === validatedData.username) {
          res.status(StatusCodes.CONFLICT).json({
            message: "Username already taken",
            status: StatusCodes.CONFLICT,
          });
          return;
        }
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const { data: user, error } = await db
        .from("users")
        .insert({
          email: validatedData.email,
          username: validatedData.username,
          password: hashedPassword,
          role: validatedData.role || "reader",
          profile: validatedData.profile,
          bio: validatedData.bio,
          avatar: validatedData.avatar,
          is_verified: false,
          verification_token: verificationToken,
          verification_expires: verificationExpires,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !user) {
        throw error || new Error("Failed to create user");
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/auth/verify?token=${verificationToken}`;

      try {
        await emailService.sendVerificationEmail(user.email, verificationUrl);
      } catch (emailError) {
        console.error("[AUTH] Failed to send verification email:", emailError);
      }

      res.status(StatusCodes.CREATED).json({
        message: "Registration successful. Please check your email to verify your account.",
        userId: user.id,
      });
    } catch (error) {
      console.error("[AUTH] Registration error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Registration failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors: parseResult.error?.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      const { data: user } = await db
        .from("users")
        .select("*")
        .eq("email", validatedData.email)
        .single();

      if (!user || !user.password) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

      if (!isPasswordValid) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      if (!user.is_verified) {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Please verify your email before logging in",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      const { accessToken, refreshToken } = tokenService.generateTokenPair(user);

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(StatusCodes.OK).json({
        message: "Login successful",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
          bio: user.bio,
          avatar: user.avatar,
          socials: user.socials,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Login failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const logout = async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(StatusCodes.OK).json({
        message: "Logout successful",
      });
    } catch (error) {
      console.error("[AUTH] Logout error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Logout failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "No refresh token provided",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const decoded = tokenService.verifyRefreshToken(refreshToken);

      if (!decoded) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid or expired refresh token",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { data: user } = await db
        .from("users")
        .select("*")
        .eq("id", decoded.userId)
        .single();

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const tokens = tokenService.rotateTokens(refreshToken, user);

      if (!tokens) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Token rotation failed",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(StatusCodes.OK).json({
        message: "Token refreshed successfully",
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error("[AUTH] Refresh error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Token refresh failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const verify = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = verifyEmailSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors: parseResult.error?.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token } = parseResult.data;

      const { data: user } = await db
        .from("users")
        .select("*")
        .eq("verification_token", token)
        .gt("verification_expires", new Date().toISOString())
        .single();

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired verification token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { error } = await db
        .from("users")
        .update({
          is_verified: true,
          verification_token: null,
          verification_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      res.status(StatusCodes.OK).json({
        message: "Email verified successfully. You can now log in.",
      });
    } catch (error) {
      console.error("[AUTH] Verification error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Email verification failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const me = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Unauthorized",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const { data: user } = await db
        .from("users")
        .select("id, email, username, role, profile, bio, avatar, socials, is_verified, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "User not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
          bio: user.bio,
          avatar: user.avatar,
          socials: user.socials,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      console.error("[AUTH] Me error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch user",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const forgot = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = forgotPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors: parseResult.error?.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { email } = parseResult.data;

      const { data: user } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (!user) {
        res.status(StatusCodes.OK).json({
          message: "If the email exists, a password reset link has been sent.",
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await db
        .from("users")
        .update({
          reset_token: resetToken,
          reset_expires: resetExpires,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

      try {
        await emailService.sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailError) {
        console.error("[AUTH] Failed to send password reset email:", emailError);
      }

      res.status(StatusCodes.OK).json({
        message: "If the email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("[AUTH] Forgot password error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Password reset request failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  const reset = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = resetPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors: parseResult.error?.errors?.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token, newPassword } = parseResult.data;

      const { data: user } = await db
        .from("users")
        .select("*")
        .eq("reset_token", token)
        .gt("reset_expires", new Date().toISOString())
        .single();

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired reset token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error } = await db
        .from("users")
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      res.status(StatusCodes.OK).json({
        message: "Password reset successful. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("[AUTH] Password reset error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Password reset failed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  return { register, login, logout, refresh, verify, me, forgot, reset };
}
