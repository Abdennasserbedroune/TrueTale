import dotenv from "dotenv";
import { loadEnv } from "./config/env";
import { connectDB, disconnectDB } from "@truetale/db";
import { createApp } from "./app";

// Load environment variables
dotenv.config();

const config = loadEnv();
const { app } = createApp(config);

let server: ReturnType<typeof app.listen> | null = null;

async function start(): Promise<void> {
  try {
    console.log(`[SERVER] Starting server in ${config.nodeEnv} mode...`);

    // Initialize database connection
    await connectDB(config.mongoUri);

    // Start HTTP server
    server = app.listen(config.port, () => {
      console.log(`[SERVER] Server running on http://localhost:${config.port}`);
      console.log(`[SERVER] CORS enabled for origin: ${config.clientOrigin}`);
    });
  } catch (error) {
    console.error("[SERVER] Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[SERVER] Received ${signal} signal. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("[SERVER] HTTP server closed");

      try {
        await disconnectDB();
      } catch (error) {
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
