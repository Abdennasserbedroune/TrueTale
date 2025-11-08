import { IUser, UserRole } from "../models/User";
export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
}
export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}
export declare class TokenService {
    private accessTokenSecret;
    private refreshTokenSecret;
    constructor(accessTokenSecret: string, refreshTokenSecret: string);
    generateAccessToken(user: IUser): string;
    generateRefreshToken(user: IUser): string;
    generateTokenPair(user: IUser): {
        accessToken: string;
        refreshToken: string;
    };
    verifyAccessToken(token: string): DecodedToken | null;
    verifyRefreshToken(token: string): DecodedToken | null;
    rotateTokens(refreshToken: string, user: IUser): {
        accessToken: string;
        refreshToken: string;
    } | null;
}
//# sourceMappingURL=tokenService.d.ts.map