import { Router } from "express";
import rateLimit from "express-rate-limit";
import { TokenService } from "../utils/tokenService";
import { createAuthController } from "../controllers/authController";
import { createAuthMiddleware } from "../middleware/authMiddleware";
import { EmailService } from "../services/emailService";

export function createAuthRoutes(tokenService: TokenService): Router {
  const router = Router();
  const emailService = new EmailService();
  const authController = createAuthController(tokenService, emailService);
  const { requireAuth } = createAuthMiddleware(tokenService);

  // Rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many authentication attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: "Too many email requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Public routes
  router.post("/register", authLimiter, authController.register);
  router.post("/login", authLimiter, authController.login);
  router.post("/verify", authController.verify);
  router.post("/forgot", emailLimiter, authController.forgot);
  router.post("/reset", authController.reset);
  router.post("/refresh", authController.refresh);
  router.post("/logout", authController.logout);

  // Protected routes
  router.get("/me", requireAuth, authController.me);

  return router;
}
