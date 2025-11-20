import jwt from "jsonwebtoken";
import { IUser, UserRole } from "@truetale/db";

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  roles?: string[];
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export class TokenService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;

  constructor(accessTokenSecret: string, refreshTokenSecret: string) {
    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;
  }

  generateAccessToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  generateRefreshToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }

  generateTokenPair(user: IUser): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  verifyAccessToken(token: string): DecodedToken | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as DecodedToken;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): DecodedToken | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as DecodedToken;
    } catch {
      return null;
    }
  }

  rotateTokens(
    refreshToken: string,
    user: IUser
  ): { accessToken: string; refreshToken: string } | null {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded || decoded.userId !== user._id.toString()) {
      return null;
    }

    return this.generateTokenPair(user);
  }
}
