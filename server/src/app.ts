import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { EnvConfig } from "./config/env";
import { TokenService } from "./utils/tokenService";
import { FeedService } from "./utils/feedService";
import { createAuthRoutes } from "./routes/authRoutes";
import { createWriterRoutes } from "./routes/writerRoutes";

interface ErrorResponse {
  message: string;
  status: number;
}

export function createApp(
  config: EnvConfig
): { app: Express; tokenService: TokenService; feedService: FeedService } {
  const app = express();

  // Trust proxy
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser middleware
  app.use(cookieParser());

  // Compression middleware
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
  });
  app.use(limiter);

  // Initialize token service
  const tokenService = new TokenService(config.jwtSecret, config.jwtRefreshSecret);
  const feedService = new FeedService();

  // Health check route
  app.get("/health", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ status: "ok" });
  });

  // Auth routes
  app.use("/api/auth", createAuthRoutes(tokenService));

  // Writer routes
  app.use("/api/writer", createWriterRoutes(tokenService, feedService));

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found",
      status: StatusCodes.NOT_FOUND,
    });
  });

  // Centralized error handler (must be last)
  app.use(
    (
      err: Error | ErrorResponse,
      _req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
    ) => {
      const status = "status" in err ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;
      const message = err.message || "An unexpected error occurred";

      console.error(`[ERROR] ${status} - ${message}`);

      res.status(status).json({
        message,
        status,
      });
    }
  );

  return { app, tokenService, feedService };
}
