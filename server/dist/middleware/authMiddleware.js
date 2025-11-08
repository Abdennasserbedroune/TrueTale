"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
const http_status_codes_1 = require("http-status-codes");
function createAuthMiddleware(tokenService) {
    const requireAuth = (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "No token provided",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            const token = authHeader.split(" ")[1];
            const decoded = tokenService.verifyAccessToken(token);
            if (!decoded) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid or expired token",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
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
        }
        catch {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Authentication failed",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
    };
    const requireRole = (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    message: "Authentication required",
                    status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
                return;
            }
            if (!roles.includes(req.user.role)) {
                res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    message: `Access denied. Required role: ${roles.join(" or ")}`,
                    status: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
                return;
            }
            next();
        };
    };
    return { requireAuth, requireRole };
}
//# sourceMappingURL=authMiddleware.js.map