"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
const tokenService_1 = require("./utils/tokenService");
const feedService_1 = require("./utils/feedService");
const authRoutes_1 = require("./routes/authRoutes");
const readerRoutes_1 = require("./routes/readerRoutes");
const writerRoutes_1 = require("./routes/writerRoutes");
const marketplaceRoutes_1 = require("./routes/marketplaceRoutes");
const feedRoutes_1 = require("./routes/feedRoutes");
const orderRoutes_1 = require("./routes/orderRoutes");
function createApp(config) {
    const app = (0, express_1.default)();
    // Trust proxy
    app.set("trust proxy", 1);
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS middleware
    app.use((0, cors_1.default)({
        origin: config.clientOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    // Body parsing middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Cookie parser middleware
    app.use((0, cookie_parser_1.default)());
    // Compression middleware
    app.use((0, compression_1.default)());
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
    });
    app.use(limiter);
    // Initialize token service
    const tokenService = new tokenService_1.TokenService(config.jwtSecret, config.jwtRefreshSecret);
    const feedService = new feedService_1.FeedService();
    // Health check route
    app.get("/health", (_req, res) => {
        res.status(http_status_codes_1.StatusCodes.OK).json({ status: "ok" });
    });
    // Auth routes
    app.use("/api/auth", (0, authRoutes_1.createAuthRoutes)(tokenService));
    // Reader routes
    app.use("/api", (0, readerRoutes_1.createReaderRoutes)(tokenService, feedService));
    // Order routes
    app.use("/api", (0, orderRoutes_1.createOrderRoutes)(tokenService));
    // Writer routes
    app.use("/api/writer", (0, writerRoutes_1.createWriterRoutes)(tokenService, feedService));
    // Feed routes
    app.use("/api", (0, feedRoutes_1.createFeedRoutes)(tokenService, feedService));
    // Marketplace routes
    app.use("/api/marketplace", (0, marketplaceRoutes_1.createMarketplaceRoutes)());
    // 404 handler
    app.use((_req, res) => {
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            message: "Route not found",
            status: http_status_codes_1.StatusCodes.NOT_FOUND,
        });
    });
    // Centralized error handler (must be last)
    app.use((err, _req, res, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next) => {
        const status = "status" in err ? err.status : http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        const message = err.message || "An unexpected error occurred";
        console.error(`[ERROR] ${status} - ${message}`);
        res.status(status).json({
            message,
            status,
        });
    });
    return { app, tokenService, feedService };
}
//# sourceMappingURL=app.js.map