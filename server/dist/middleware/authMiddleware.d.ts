import { Request, Response, NextFunction } from "express";
import { TokenService, TokenPayload } from "../utils/tokenService";
import { UserRole } from "../models/User";
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function createAuthMiddleware(tokenService: TokenService): {
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=authMiddleware.d.ts.map