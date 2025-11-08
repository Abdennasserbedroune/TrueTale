"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWriterRoutes = createWriterRoutes;
const express_1 = require("express");
const middleware_1 = require("../middleware");
const writerController_1 = require("../controllers/writerController");
function createWriterRoutes(tokenService, feedService) {
    const router = (0, express_1.Router)();
    const { requireAuth, requireRole } = (0, middleware_1.createAuthMiddleware)(tokenService);
    const writerController = (0, writerController_1.createWriterController)(feedService);
    router.use(requireAuth, requireRole("writer"));
    router.post("/books", writerController.createBook);
    router.get("/books", writerController.getBooks);
    router.put("/books/:id", writerController.updateBook);
    router.delete("/books/:id", writerController.deleteBook);
    router.get("/drafts", writerController.getDrafts);
    router.post("/drafts", writerController.createDraft);
    router.put("/drafts/:id", writerController.updateDraft);
    router.delete("/drafts/:id", writerController.deleteDraft);
    router.get("/stories", writerController.getStories);
    router.post("/stories", writerController.createStory);
    router.delete("/stories/:id", writerController.deleteStory);
    router.get("/profile", writerController.getProfile);
    router.put("/profile", writerController.updateProfile);
    return router;
}
//# sourceMappingURL=writerRoutes.js.map