import express from "express";
import { adminController } from "../controllers/adminController";
import { createAuthMiddleware } from "../middleware";
import { TokenService } from "../utils/tokenService";

export function createAdminRoutes(tokenService: TokenService) {
  const router = express.Router();
  const { requireAuth } = createAuthMiddleware(tokenService);

  // All admin routes require authentication
  // Role checking is done in the controller methods

  // User Management
  router.get("/users", requireAuth, (req, res) =>
    adminController.listUsers(req, res)
  );
  router.post("/users/:id/ban", requireAuth, (req, res) =>
    adminController.banUser(req, res)
  );
  router.post("/users/:id/unban", requireAuth, (req, res) =>
    adminController.unbanUser(req, res)
  );

  // Content Moderation
  router.delete("/books/:id", requireAuth, (req, res) =>
    adminController.removeBook(req, res)
  );
  router.delete("/reviews/:id", requireAuth, (req, res) =>
    adminController.removeReview(req, res)
  );

  // Order Management & Disputes
  router.get("/orders", requireAuth, (req, res) =>
    adminController.listOrders(req, res)
  );
  router.post("/orders/:id/refund", requireAuth, (req, res) =>
    adminController.refundOrder(req, res)
  );

  // Platform Settings & Reports
  router.get("/settings", requireAuth, (req, res) =>
    adminController.getPlatformSettings(req, res)
  );
  router.put("/platform-fee", requireAuth, (req, res) =>
    adminController.updatePlatformFee(req, res)
  );
  router.get("/earnings-report", requireAuth, (req, res) =>
    adminController.getEarningsReport(req, res)
  );
  router.get("/top-sellers", requireAuth, (req, res) =>
    adminController.getTopSellers(req, res)
  );

  return router;
}
