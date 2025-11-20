import { Router } from "express";
import { TokenService } from "../utils/tokenService";
import { createAuthMiddleware } from "../middleware";
import { createOrderController } from "../controllers/orderController";

export function createOrderRoutes(tokenService: TokenService): Router {
  const router = Router();
  const { requireAuth } = createAuthMiddleware(tokenService);
  const orderController = createOrderController();

  // Book checkout endpoint
  router.get("/books/:id/checkout", requireAuth, orderController.getBookCheckout);

  // Order management
  router.post("/orders", requireAuth, orderController.createOrder);
  router.get("/user/orders", requireAuth, orderController.getUserOrders);
  router.get("/user/purchases", requireAuth, orderController.getUserPurchases);

  // Webhook endpoint (no auth required)
  router.post("/webhooks/stripe", orderController.handleStripeWebhook);

  return router;
}