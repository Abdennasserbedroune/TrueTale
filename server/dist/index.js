"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const app_1 = require("./app");
// Load environment variables
dotenv_1.default.config();
const config = (0, env_1.loadEnv)();
const { app } = (0, app_1.createApp)(config);
let server = null;
async function start() {
    try {
        console.log(`[SERVER] Starting server in ${config.nodeEnv} mode...`);
        // Initialize database connection
        await (0, db_1.initializeDB)(config);
        // Start HTTP server
        server = app.listen(config.port, () => {
            console.log(`[SERVER] Server running on http://localhost:${config.port}`);
            console.log(`[SERVER] CORS enabled for origin: ${config.clientOrigin}`);
        });
    }
    catch (error) {
        console.error("[SERVER] Failed to start server:", error);
        process.exit(1);
    }
}
async function gracefulShutdown(signal) {
    console.log(`\n[SERVER] Received ${signal} signal. Starting graceful shutdown...`);
    if (server) {
        server.close(async () => {
            console.log("[SERVER] HTTP server closed");
            try {
                await (0, db_1.closeDB)();
            }
            catch (error) {
                console.error("[SERVER] Error closing database:", error);
            }
            console.log("[SERVER] Graceful shutdown complete");
            process.exit(0);
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error("[SERVER] Forced shutdown - graceful shutdown took too long");
            process.exit(1);
        }, 10000);
    }
}
// Handle graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("[SERVER] Uncaught exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("[SERVER] Unhandled rejection at:", promise, "reason:", reason);
    process.exit(1);
});
start();
//# sourceMappingURL=index.js.map