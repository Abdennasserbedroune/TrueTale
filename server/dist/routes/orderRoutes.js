"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderRoutes = createOrderRoutes;
const express_1 = require("express");
const middleware_1 = require("../middleware");
const orderController_1 = require("../controllers/orderController");
function createOrderRoutes(tokenService) {
    const router = (0, express_1.Router)();
    const { requireAuth } = (0, middleware_1.createAuthMiddleware)(tokenService);
    const orderController = (0, orderController_1.createOrderController)();
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
//# sourceMappingURL=orderRoutes.js.map