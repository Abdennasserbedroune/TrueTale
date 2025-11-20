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
import { createReaderRoutes } from "./routes/readerRoutes";
import { createWriterRoutes } from "./routes/writerRoutes";
import { createMarketplaceRoutes } from "./routes/marketplaceRoutes";
import { createFeedRoutes } from "./routes/feedRoutes";
import { createOrderRoutes } from "./routes/orderRoutes";
import { createProfileRoutes } from "./routes/profileRoutes";
import { createBookRoutes } from "./routes/bookRoutes";
import { createDashboardRoutes } from "./routes/dashboardRoutes";
import { createAdminRoutes } from "./routes/adminRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { sanitizeInput, errorHandler } from "./middleware";
import { logger } from "./lib/logger";

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

  // Body parsing middleware (skip for Stripe webhook)
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/webhooks/stripe") {
      next();
    } else {
      express.json()(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser middleware
  app.use(cookieParser());

  // Compression middleware
  app.use(compression());

  // Input sanitization (XSS prevention)
  app.use(sanitizeInput);

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

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    });
    next();
  });

  // Health check routes
  app.use("/", healthRoutes);

  // Auth routes
  app.use("/api/auth", createAuthRoutes(tokenService));

  // Profile routes
  app.use("/api/users", createProfileRoutes(tokenService));

  // Book routes (new comprehensive book system)
  app.use("/api/books", createBookRoutes(tokenService));

  // Reader routes
  app.use("/api", createReaderRoutes(tokenService, feedService));

  // Order routes
  app.use("/api", createOrderRoutes(tokenService, config));

  // Writer routes
  app.use("/api/writer", createWriterRoutes(tokenService, feedService));

  // Feed routes
  app.use("/api", createFeedRoutes(tokenService, feedService));

  // Marketplace routes
  app.use("/api/marketplace", createMarketplaceRoutes());

  // Dashboard routes (seller + admin)
  app.use("/api/v1/seller/dashboard", createDashboardRoutes(tokenService));

  // Admin routes (comprehensive admin panel)
  app.use("/api/v1/admin", createAdminRoutes(tokenService));

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found",
      status: StatusCodes.NOT_FOUND,
    });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return { app, tokenService, feedService };
}
