"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthController = createAuthController;
const http_status_codes_1 = require("http-status-codes");
const User_1 = require("../models/User");
const authValidation_1 = require("../validation/authValidation");
const REFRESH_TOKEN_COOKIE = "refreshToken";
function createAuthController(tokenService) {
    const register = async (req, res) => {
        try {
            // Validate request body
            const parseResult = authValidation_1.registerSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    message: "Validation error",
                    errors: parseResult.error?.errors?.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })) || [],
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const validatedData = parseResult.data;
            // Check if user already exists
            const existingUser = await User_1.User.findOne({
                $or: [{ email: validatedData.email }, { username: validatedData.username }],
            });
            if (existingUser) {
                if (existingUser.email === validatedData.email) {
                    res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                        message: "Email already registered",
                        status: http_status_codes_1.StatusCodes.CONFLICT,
                    });
                    return;
                }
                if (existingUser.username === validatedData.username) {
                    res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                        message: "Username already taken",
                        status: http_status_codes_1.StatusCodes.CONFLICT,
                    });
                    return;
                }
            }
            // Create new user
            const user = new User_1.User({
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
            res.status(http_status_codes_1.StatusCodes.CREATED).json({
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
        }
        catch (error) {
            console.error("[AUTH] Registration error:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Registration failed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const login = async (req, res) => {
        try {
            // Validate request body
            const parseResult = authValidation_1.loginSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    message: "Validation error",
                    errors: parseResult.error?.errors?.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })) || [],
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const validatedData = parseResult.data;
            // Find user by email
            const user = await User_1.User.findOne({ email: validatedData.email });
            if (!user) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid email or password",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            // Compare passwords
            const isPasswordValid = await user.comparePassword(validatedData.password);
            if (!isPasswordValid) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid email or password",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
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
            res.status(http_status_codes_1.StatusCodes.OK).json({
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
        }
        catch (error) {
            console.error("[AUTH] Login error:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Login failed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const logout = async (req, res) => {
        try {
            // Clear refresh token cookie
            res.clearCookie(REFRESH_TOKEN_COOKIE, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                message: "Logout successful",
            });
        }
        catch (error) {
            console.error("[AUTH] Logout error:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Logout failed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    const refresh = async (req, res) => {
        try {
            // Get refresh token from cookie
            const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
            if (!refreshToken) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "No refresh token provided",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            // Verify refresh token
            const decoded = tokenService.verifyRefreshToken(refreshToken);
            if (!decoded) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid or expired refresh token",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            // Find user
            const user = await User_1.User.findById(decoded.userId);
            if (!user) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "User not found",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            // Generate new token pair
            const tokens = tokenService.rotateTokens(refreshToken, user);
            if (!tokens) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Token rotation failed",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
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
            res.status(http_status_codes_1.StatusCodes.OK).json({
                message: "Token refreshed successfully",
                accessToken: tokens.accessToken,
            });
        }
        catch (error) {
            console.error("[AUTH] Refresh error:", error);
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Token refresh failed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    };
    return { register, login, logout, refresh };
}
//# sourceMappingURL=authController.js.map