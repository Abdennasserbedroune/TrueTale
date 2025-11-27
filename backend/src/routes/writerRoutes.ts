import { Router } from "express";
import { TokenService } from "../utils/tokenService";
import { FeedService } from "../utils/feedService";
import { createAuthMiddleware } from "../middleware";
import { createWriterController } from "../controllers/writerController";

export function createWriterRoutes(tokenService: TokenService, feedService: FeedService): Router {
  const router = Router();
  const { requireAuth, requireRole } = createAuthMiddleware(tokenService);
  const writerController = createWriterController(feedService);

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
