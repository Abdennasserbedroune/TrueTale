import { Router, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { TokenService } from "../utils/tokenService";
import { FeedService } from "../utils/feedService";
import { createAuthMiddleware } from "../middleware";

type ErrorResponse = {
  message: string;
  status: number;
};

const sendErrorResponse = (res: Response, error: ErrorResponse): void => {
  res.status(error.status).json(error);
};

export function createFeedRoutes(tokenService: TokenService, feedService: FeedService): Router {
  const router = Router();
  const { requireAuth } = createAuthMiddleware(tokenService);

  router.get("/feed", requireAuth, async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendErrorResponse(res, {
        message: "Authentication required",
        status: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      if (page < 1 || limit < 1 || limit > 100) {
        sendErrorResponse(res, {
          message: "Invalid pagination parameters",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const result = await feedService.getPersonalFeed(req.user.userId, { page, limit });

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error("[FEED] Get personal feed error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch feed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.get("/feed/global", async (req: Request, res: Response): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      if (page < 1 || limit < 1 || limit > 100) {
        sendErrorResponse(res, {
          message: "Invalid pagination parameters",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const result = await feedService.getGlobalFeed({ page, limit });

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error("[FEED] Get global feed error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch global feed",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  });

  router.get("/feed/trending", async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

      if (limit < 1 || limit > 50) {
        sendErrorResponse(res, {
          message: "Invalid limit parameter (1-50)",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      if (days < 1 || days > 365) {
        sendErrorResponse(res, {
          message: "Invalid days parameter (1-365)",
          status: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const result = await feedService.getTrendingBooks({ limit, days });

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.error("[FEED] Get trending books error:", error);
      sendErrorResponse(res, {
        message: "Failed to fetch trending books",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  });

  return router;
}
