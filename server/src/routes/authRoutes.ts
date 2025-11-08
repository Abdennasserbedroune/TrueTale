import { Router } from "express";
import { TokenService } from "../utils/tokenService";
import { createAuthController } from "../controllers/authController";

export function createAuthRoutes(tokenService: TokenService): Router {
  const router = Router();
  const authController = createAuthController(tokenService);

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);
  router.post("/refresh", authController.refresh);

  return router;
}
