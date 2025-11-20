import { Router } from "express";
import express from "express";
import { TokenService } from "../utils/tokenService";
import { EnvConfig } from "../config/env";
import { createAuthMiddleware, costlyLimiter } from "../middleware";
import { createOrderController } from "../controllers/orderController";

export function createOrderRoutes(tokenService: TokenService, config: EnvConfig): Router {
  const router = Router();
  const { requireAuth } = createAuthMiddleware(tokenService);
  const orderController = createOrderController(config);

  router.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    orderController.handleStripeWebhook
  );

  router.get("/books/:id/checkout", requireAuth, orderController.getBookCheckout);

  // Order creation with rate limiting to prevent abuse
  router.post("/orders", requireAuth, costlyLimiter, orderController.createOrder);
  router.get("/orders/:id", requireAuth, orderController.getOrder);
  router.get("/user/orders", requireAuth, orderController.getUserOrders);
  router.get("/user/purchases", requireAuth, orderController.getUserPurchases);

  router.get("/seller/orders", requireAuth, orderController.getSellerOrders);
  router.get("/seller/earnings", requireAuth, orderController.getSellerEarnings);

  return router;
}
