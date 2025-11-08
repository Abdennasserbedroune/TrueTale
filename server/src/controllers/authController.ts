import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/User";
import { TokenService } from "../utils/tokenService";
import { registerSchema, loginSchema } from "../validation/authValidation";

const REFRESH_TOKEN_COOKIE = "refreshToken";

export function createAuthController(tokenService: TokenService) {
  const register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
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

      // Create new user
      const user = new User({
        email: validatedData.email,
        username: validatedData.username,
        password: validatedData.password,
        role: validatedData.role || "reader",
        profile: validatedData.profile,
        bio: validatedData.bio,
        avatar: validatedData.avatar,
      });

      await user.save();

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
      res.status(StatusCodes.CREATED).json({
        message: "User registered successfully",
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
            parseResult.error?.errors?.map((err) => ({
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

  return { register, login, logout, refresh };
}
