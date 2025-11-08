import { Router } from "express";
import { TokenService } from "../utils/tokenService";
import { FeedService } from "../utils/feedService";
import { createAuthMiddleware } from "../middleware";
import { createReaderController } from "../controllers/readerController";

export function createReaderRoutes(tokenService: TokenService, feedService: FeedService): Router {
  const router = Router();
  const { requireAuth } = createAuthMiddleware(tokenService);
  const readerController = createReaderController(feedService);

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
