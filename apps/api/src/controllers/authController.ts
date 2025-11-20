import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "@truetale/db";
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

const REFRESH_TOKEN_COOKIE = "refreshToken";

export function createAuthController(tokenService: TokenService, emailService: EmailService) {
  const register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const parseResult = registerSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.issues?.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: validatedData.email }, { username: validatedData.username }],
      });

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

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create new user
      const user = new User({
        email: validatedData.email,
        username: validatedData.username,
        password: validatedData.password,
        role: validatedData.role || "reader",
        profile: validatedData.profile,
        bio: validatedData.bio,
        avatar: validatedData.avatar,
        isVerified: false,
        verificationToken,
        verificationExpires,
        refreshTokens: [],
      });

      await user.save();

      // Send verification email
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/auth/verify?token=${verificationToken}`;
      
      try {
        await emailService.sendVerificationEmail(user.email, verificationUrl);
      } catch (emailError) {
        console.error("[AUTH] Failed to send verification email:", emailError);
      }

      // Return success message without tokens (user must verify email first)
      res.status(StatusCodes.CREATED).json({
        message: "Registration successful. Please check your email to verify your account.",
        userId: user._id,
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
      // Validate request body
      const parseResult = loginSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.issues?.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validatedData = parseResult.data;

      // Find user by email
      const user = await User.findOne({ email: validatedData.email });

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Compare passwords
      const isPasswordValid = await user.comparePassword(validatedData.password);

      if (!isPasswordValid) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid email or password",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Check if user is verified
      if (!user.isVerified) {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Please verify your email before logging in",
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = tokenService.generateTokenPair(user);

      // Set refresh token as httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return sanitized user and access token
      res.status(StatusCodes.OK).json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
          bio: user.bio,
          avatar: user.avatar,
          socials: user.socials,
          createdAt: user.createdAt,
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
      // Clear refresh token cookie
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
      // Get refresh token from cookie
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "No refresh token provided",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);

      if (!decoded) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid or expired refresh token",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Generate new token pair
      const tokens = tokenService.rotateTokens(refreshToken, user);

      if (!tokens) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Token rotation failed",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      // Set new refresh token as httpOnly cookie
      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return new access token
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
      // Validate request body
      const parseResult = verifyEmailSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.issues?.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token } = parseResult.data;

      // Find user with valid verification token
      const user = await User.findOne({
        verificationToken: token,
        verificationExpires: { $gt: new Date() },
      });

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired verification token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      // Mark user as verified and clear verification token
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
      await user.save();

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

      // Find user and exclude password
      const user = await User.findById(userId).select("-password");

      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "User not found",
          status: StatusCodes.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
          bio: user.bio,
          avatar: user.avatar,
          socials: user.socials,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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
      // Validate request body
      const parseResult = forgotPasswordSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.issues?.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { email } = parseResult.data;

      // Find user by email
      const user = await User.findOne({ email });

      // Always return success to prevent email enumeration
      if (!user) {
        res.status(StatusCodes.OK).json({
          message: "If the email exists, a password reset link has been sent.",
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.resetToken = resetToken;
      user.resetExpires = resetExpires;
      await user.save();

      // Send password reset email
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
      // Validate request body
      const parseResult = resetPasswordSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Validation error",
          errors:
            parseResult.error?.issues?.map((err: any) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const { token, newPassword } = parseResult.data;

      // Find user with valid reset token
      const user = await User.findOne({
        resetToken: token,
        resetExpires: { $gt: new Date() },
      });

      if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid or expired reset token",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.resetToken = undefined;
      user.resetExpires = undefined;
      await user.save();

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
