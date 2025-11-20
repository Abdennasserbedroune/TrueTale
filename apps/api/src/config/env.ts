export interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  clientOrigin: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  frontendUrl: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

export function loadEnv(): EnvConfig {
  const port = parseInt(getEnvVar("PORT", "5000"), 10);
  const nodeEnv = getEnvVar("NODE_ENV", "development");
  const mongoUri = getEnvVar("MONGO_URI", "mongodb://localhost:27017/truetale");
  const clientOrigin = getEnvVar("CLIENT_ORIGIN", "http://localhost:3000");
  const jwtSecret = getEnvVar("JWT_SECRET", "dev-jwt-secret-key");
  const jwtRefreshSecret = getEnvVar("JWT_REFRESH_SECRET", "dev-jwt-refresh-secret-key");
  const frontendUrl = getEnvVar("FRONTEND_URL", "http://localhost:3000");

  return {
    port,
    nodeEnv,
    mongoUri,
    clientOrigin,
    jwtSecret,
    jwtRefreshSecret,
    frontendUrl,
  };
}
