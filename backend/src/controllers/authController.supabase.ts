import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getSupabaseClient } from "../config/supabaseClient";
import { UserRepository, User } from "../repositories/userRepository";
import { TokenService } from "../utils/tokenService";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validation/authValidation";
import { EmailService } from "../services/emailService";

const REFRESH_TOKEN_COOKIE = "refreshToken";

interface UserForToken {
  id: string;
  email: string;
  username: string;
  role: "reader" | "writer";
}

export function createSupabaseAuthController(tokenService: TokenService, emailService: EmailService) {
  const supabase = getSupabaseClient();
  const userRepository = new UserRepository();

  const generateAccessToken = (user: UserForToken): string => {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const jwt = require("jsonwebtoken");
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  };

  const generateRefreshToken = (user: UserForToken): string => {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const jwt = require("jsonwebtoken");
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  };

  const register = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = registerSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.errors?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      const existingUser = await userRepository.findByEmailOrUsername(validatedData.email, validatedData.username);

      if (existingUser) {
        if (existingUser.email === validatedData.email.toLowerCase()) {
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

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: false,
      });

      if (authError || !authData.user) {
        console.error("[AUTH] Supabase auth error:", authError);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: authError?.message || "Failed to create user account",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      const user = await userRepository.create({
        id: authData.user.id,
        email: validatedData.email,
        username: validatedData.username,
        role: validatedData.role || "reader",
        profile: validatedData.profile,
        bio: validatedData.bio,
        avatar: validatedData.avatar,
        is_verified: false,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/auth/verify?token=${authData.user.id}`;

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
          errors:
            parseResult.error?.errors?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError || !authData.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const user = await userRepository.findById(authData.user.id);

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
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

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

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

      const user = await userRepository.findById(decoded.userId);

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(StatusCodes.OK).json({
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
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
          errors:
            parseResult.error?.errors?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token } = parseResult.data;

      const user = await userRepository.findById(token);

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid verification token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      if (user.is_verified) {
        res.status(StatusCodes.OK).json({
          message: "Email already verified. You can log in.",
        });
        return;
      }

      await userRepository.update(user.id, { is_verified: true });

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

      const user = await userRepository.findById(userId);

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
          errors:
            parseResult.error?.errors?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { email } = parseResult.data;

      const user = await userRepository.findByEmail(email);

      if (!user) {
        res.status(StatusCodes.OK).json({
          message: "If the email exists, a password reset link has been sent.",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
      });

      if (error) {
        console.error("[AUTH] Password reset error:", error);
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
          errors:
            parseResult.error?.errors?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token, newPassword } = parseResult.data;

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired reset token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

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
