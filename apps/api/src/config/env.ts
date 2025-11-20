export interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  clientOrigin: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  frontendUrl: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  platformFeePercent: number;
  awsS3Bucket: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
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
  const stripeSecretKey = getEnvVar("STRIPE_SECRET_KEY", "");
  const stripeWebhookSecret = getEnvVar("STRIPE_WEBHOOK_SECRET", "");
  const platformFeePercent = parseFloat(getEnvVar("PLATFORM_FEE_PERCENT", "10"));
  const awsS3Bucket = getEnvVar("AWS_S3_BUCKET", "");
  const awsAccessKeyId = getEnvVar("AWS_ACCESS_KEY_ID", "");
  const awsSecretAccessKey = getEnvVar("AWS_SECRET_ACCESS_KEY", "");
  const awsRegion = getEnvVar("AWS_REGION", "us-east-1");

  return {
    port,
    nodeEnv,
    mongoUri,
    clientOrigin,
    jwtSecret,
    jwtRefreshSecret,
    frontendUrl,
    stripeSecretKey,
    stripeWebhookSecret,
    platformFeePercent,
    awsS3Bucket,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
  };
}
