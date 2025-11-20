import mongoose from "mongoose";
import { EnvConfig } from "./env";

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

async function connectWithRetry(mongoUri: string, attempt: number = 1): Promise<typeof mongoose> {
  try {
    console.log(`[DB] Attempting to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
    const connection = await mongoose.connect(mongoUri);
    console.log("[DB] Successfully connected to MongoDB");
    return connection;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[DB] Connection attempt ${attempt} failed. Retrying in ${RETRY_DELAY}ms...`,
        error instanceof Error ? error.message : String(error)
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectWithRetry(mongoUri, attempt + 1);
    } else {
      console.error("[DB] Failed to connect to MongoDB after maximum retries");
      throw error;
    }
  }
}

export async function initializeDB(config: EnvConfig): Promise<void> {
  try {
    await connectWithRetry(config.mongoUri);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] Disconnected from MongoDB");
    });

    mongoose.connection.on("error", (error) => {
      console.error("[DB] MongoDB connection error:", error);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[DB] Reconnected to MongoDB");
    });
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}

export async function closeDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("[DB] MongoDB connection closed");
  } catch (error) {
    console.error("[DB] Error closing MongoDB connection:", error);
    throw error;
  }
}
