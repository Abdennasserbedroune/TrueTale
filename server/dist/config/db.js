"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDB = initializeDB;
exports.closeDB = closeDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
async function connectWithRetry(mongoUri, attempt = 1) {
  try {
    console.log(`[DB] Attempting to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
    const connection = await mongoose_1.default.connect(mongoUri);
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
async function initializeDB(config) {
  try {
    await connectWithRetry(config.mongoUri);
    // Handle connection events
    mongoose_1.default.connection.on("disconnected", () => {
      console.warn("[DB] Disconnected from MongoDB");
    });
    mongoose_1.default.connection.on("error", (error) => {
      console.error("[DB] MongoDB connection error:", error);
    });
    mongoose_1.default.connection.on("reconnected", () => {
      console.log("[DB] Reconnected to MongoDB");
    });
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}
async function closeDB() {
  try {
    await mongoose_1.default.disconnect();
    console.log("[DB] MongoDB connection closed");
  } catch (error) {
    console.error("[DB] Error closing MongoDB connection:", error);
    throw error;
  }
}
//# sourceMappingURL=db.js.map
