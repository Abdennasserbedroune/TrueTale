"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
class TokenService {
    constructor(accessTokenSecret, refreshTokenSecret) {
        this.accessTokenSecret = accessTokenSecret;
        this.refreshTokenSecret = refreshTokenSecret;
    }
    generateAccessToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
    }
    generateRefreshToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });
    }
    generateTokenPair(user) {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
        };
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
        }
        catch {
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
        }
        catch {
            return null;
        }
    }
    rotateTokens(refreshToken, user) {
        const decoded = this.verifyRefreshToken(refreshToken);
        if (!decoded || decoded.userId !== user._id.toString()) {
            return null;
        }
        return this.generateTokenPair(user);
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=tokenService.js.map