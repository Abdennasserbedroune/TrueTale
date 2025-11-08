"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
function createAuthRoutes(tokenService) {
    const router = (0, express_1.Router)();
    const authController = (0, authController_1.createAuthController)(tokenService);
    router.post("/register", authController.register);
    router.post("/login", authController.login);
    router.post("/logout", authController.logout);
    router.post("/refresh", authController.refresh);
    return router;
}
//# sourceMappingURL=authRoutes.js.map