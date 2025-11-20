import express from "express";
import { dashboardController } from "../controllers/dashboardController";
import { adminController } from "../controllers/adminController";
import { createAuthMiddleware } from "../middleware";
import { TokenService } from "../utils/tokenService";

export function createDashboardRoutes(tokenService: TokenService) {
  const router = express.Router();
  const { requireAuth } = createAuthMiddleware(tokenService);

  // Seller dashboard routes (authenticated)
  router.get("/summary", requireAuth, (req, res) =>
    dashboardController.getSummary(req, res)
  );
  router.get("/revenue-chart", requireAuth, (req, res) =>
    dashboardController.getRevenueChart(req, res)
  );
  router.get("/top-books", requireAuth, (req, res) =>
    dashboardController.getTopBooks(req, res)
  );
  router.get("/recent-orders", requireAuth, (req, res) =>
    dashboardController.getRecentOrders(req, res)
  );
  router.get("/payouts", requireAuth, (req, res) =>
    dashboardController.getPayoutHistory(req, res)
  );
  router.get("/payout-info", requireAuth, (req, res) =>
    dashboardController.getPayoutInfo(req, res)
  );
  router.put("/payout-settings", requireAuth, (req, res) =>
    dashboardController.updatePayoutSettings(req, res)
  );

  // Admin routes (authenticated + admin role check done in controller)
  router.get("/admin/settings", requireAuth, (req, res) =>
    adminController.getPlatformSettings(req, res)
  );
  router.put("/admin/platform-fee", requireAuth, (req, res) =>
    adminController.updatePlatformFee(req, res)
  );
  router.get("/admin/earnings-report", requireAuth, (req, res) =>
    adminController.getEarningsReport(req, res)
  );
  router.get("/admin/top-sellers", requireAuth, (req, res) =>
    adminController.getTopSellers(req, res)
  );

  return router;
}
