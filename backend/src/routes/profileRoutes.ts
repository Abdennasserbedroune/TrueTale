import express from "express";
import { profileController } from "../controllers/profileController";
import { bookController } from "../controllers/bookController";
import { TokenService } from "../utils/tokenService";
import { createAuthMiddleware } from "../middleware/authMiddleware";

export function createProfileRoutes(tokenService: TokenService): express.Router {
  const router = express.Router();
  const { requireAuth } = createAuthMiddleware(tokenService);

  // Public routes
  router.get("/:username", (req, res) => profileController.getPublicProfile(req, res));
  router.get("/:username/books", (req, res) => bookController.getAuthorBooks(req, res));

  // Authenticated routes
  router.get("/", requireAuth, (req, res) => profileController.getPrivateProfile(req, res));
  router.get("/me/books", requireAuth, (req, res) => bookController.getMyBooks(req, res));
  router.put("/", requireAuth, (req, res) => profileController.updateProfile(req, res));
  router.put("/avatar", requireAuth, (req, res) => profileController.updateAvatar(req, res));
  router.put("/email", requireAuth, (req, res) => profileController.changeEmail(req, res));
  router.put("/password", requireAuth, (req, res) => profileController.changePassword(req, res));
  router.put("/role", requireAuth, (req, res) => profileController.updateRole(req, res));
  router.delete("/", requireAuth, (req, res) => profileController.requestDeletion(req, res));
  router.post("/cancel-deletion", requireAuth, (req, res) =>
    profileController.cancelDeletion(req, res)
  );

  return router;
}
