import { Router } from "express";
import { createMarketplaceController } from "../controllers/marketplaceController";

export function createMarketplaceRoutes(): Router {
  const router = Router();
  const marketplaceController = createMarketplaceController();

  // GET /api/marketplace - paginated list of published books, default sort by newest
  router.get("/", marketplaceController.getMarketplaceBooks);

  // GET /api/marketplace/search?q= - MongoDB text search across title/description/genres with relevance sorting
  router.get("/search", marketplaceController.searchMarketplaceBooks);

  // GET /api/marketplace/filter - supporting combined filters and sort options
  router.get("/filter", marketplaceController.filterMarketplaceBooks);

  // GET /api/marketplace/trending - top-rated/most-reviewed books within recent timeframe
  router.get("/trending", marketplaceController.getTrendingBooks);

  // GET /api/marketplace/categories - returning distinct categories/genres from published books
  router.get("/categories", marketplaceController.getCategories);

  return router;
}