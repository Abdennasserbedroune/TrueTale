"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReaderRoutes = createReaderRoutes;
const express_1 = require("express");
const middleware_1 = require("../middleware");
const readerController_1 = require("../controllers/readerController");
function createReaderRoutes(tokenService, feedService) {
    const router = (0, express_1.Router)();
    const { requireAuth } = (0, middleware_1.createAuthMiddleware)(tokenService);
    const readerController = (0, readerController_1.createReaderController)(feedService);
    router.get("/books", readerController.listBooks);
    router.get("/books/:id", readerController.getBookDetail);
    router.post("/books/:id/review", requireAuth, readerController.upsertReview);
    router.get("/reviews", requireAuth, readerController.getUserReviews);
    router.put("/reviews/:id", requireAuth, readerController.updateReview);
    router.delete("/reviews/:id", requireAuth, readerController.deleteReview);
    router.post("/follow/:writerId", requireAuth, readerController.followWriter);
    router.delete("/follow/:writerId", requireAuth, readerController.unfollowWriter);
    router.get("/following", requireAuth, readerController.getFollowing);
    router.get("/reader/profile", requireAuth, readerController.getProfile);
    router.put("/reader/profile", requireAuth, readerController.updateProfile);
    return router;
}
//# sourceMappingURL=readerRoutes.js.map