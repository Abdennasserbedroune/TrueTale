"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeedRoutes = createFeedRoutes;
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const middleware_1 = require("../middleware");
const sendErrorResponse = (res, error) => {
    res.status(error.status).json(error);
};
function createFeedRoutes(tokenService, feedService) {
    const router = (0, express_1.Router)();
    const { requireAuth } = (0, middleware_1.createAuthMiddleware)(tokenService);
    router.get("/feed", requireAuth, async (req, res) => {
        if (!req.user) {
            sendErrorResponse(res, {
                message: "Authentication required",
                status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
            return;
        }
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            if (page < 1 || limit < 1 || limit > 100) {
                sendErrorResponse(res, {
                    message: "Invalid pagination parameters",
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const result = await feedService.getPersonalFeed(req.user.userId, { page, limit });
            res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            console.error("[FEED] Get personal feed error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch feed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    });
    router.get("/feed/global", async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            if (page < 1 || limit < 1 || limit > 100) {
                sendErrorResponse(res, {
                    message: "Invalid pagination parameters",
                    status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
                return;
            }
            const result = await feedService.getGlobalFeed({ page, limit });
            res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            console.error("[FEED] Get global feed error:", error);
            sendErrorResponse(res, {
                message: "Failed to fetch global feed",
                status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    });
    return router;
}
//# sourceMappingURL=feedRoutes.js.map