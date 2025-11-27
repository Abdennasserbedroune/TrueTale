import express from "express";
import { bookController } from "../controllers/bookController";
import { TokenService } from "../utils/tokenService";
import { createAuthMiddleware } from "../middleware/authMiddleware";

export function createBookRoutes(tokenService: TokenService) {
  const router = express.Router();
  const { requireAuth } = createAuthMiddleware(tokenService);

  // Optional auth middleware - adds user to req if token is present
  const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = tokenService.verifyAccessToken(token);
        if (decoded) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
          };
        }
      }
    } catch {
      // Ignore errors - this is optional auth
    }
    next();
  };

  // Public routes
  router.get("/", optionalAuth, (req, res) => bookController.listBooks(req, res));
  router.get("/:slug", optionalAuth, (req, res) => bookController.getBook(req, res));

  // Authenticated routes
  router.post("/", requireAuth, (req, res) => bookController.createBook(req, res));
  router.put("/:id", requireAuth, (req, res) => bookController.updateBook(req, res));
  router.delete("/:id", requireAuth, (req, res) => bookController.deleteBook(req, res));
  router.post("/:id/file-upload-url", requireAuth, (req, res) =>
    bookController.getFileUploadUrl(req, res)
  );
  router.put("/:id/files", requireAuth, (req, res) => bookController.addFile(req, res));
  router.delete("/:id/files/:fileId", requireAuth, (req, res) =>
    bookController.deleteFile(req, res)
  );

  return router;
}
