import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { TokenService, TokenPayload } from "../utils/tokenService";
import { UserRole } from "@truetale/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function createAuthMiddleware(tokenService: TokenService) {
  const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "No token provided",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = tokenService.verifyAccessToken(token);

      if (!decoded) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid or expired token",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
      };

      next();
    } catch {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Authentication failed",
        status: StatusCodes.UNAUTHORIZED,
      });
    }
  };

  const requireRole = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Authentication required",
          status: StatusCodes.UNAUTHORIZED,
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(StatusCodes.FORBIDDEN).json({
          message: `Access denied. Required role: ${roles.join(" or ")}`,
          status: StatusCodes.FORBIDDEN,
        });
        return;
      }

      next();
    };
  };

  return { requireAuth, requireRole };
}
