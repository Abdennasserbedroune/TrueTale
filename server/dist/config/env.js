"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
function getEnvVar(key, defaultValue) {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || defaultValue || "";
}
function loadEnv() {
    const port = parseInt(getEnvVar("PORT", "5000"), 10);
    const nodeEnv = getEnvVar("NODE_ENV", "development");
    const mongoUri = getEnvVar("MONGO_URI", "mongodb://localhost:27017/truetale");
    const clientOrigin = getEnvVar("CLIENT_ORIGIN", "http://localhost:3000");
    const jwtSecret = getEnvVar("JWT_SECRET", "dev-jwt-secret-key");
    const jwtRefreshSecret = getEnvVar("JWT_REFRESH_SECRET", "dev-jwt-refresh-secret-key");
    return {
        port,
        nodeEnv,
        mongoUri,
        clientOrigin,
        jwtSecret,
        jwtRefreshSecret,
    };
}
//# sourceMappingURL=env.js.map