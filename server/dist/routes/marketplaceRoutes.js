"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMarketplaceRoutes = createMarketplaceRoutes;
const express_1 = require("express");
const marketplaceController_1 = require("../controllers/marketplaceController");
function createMarketplaceRoutes() {
    const router = (0, express_1.Router)();
    const marketplaceController = (0, marketplaceController_1.createMarketplaceController)();
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
//# sourceMappingURL=marketplaceRoutes.js.map