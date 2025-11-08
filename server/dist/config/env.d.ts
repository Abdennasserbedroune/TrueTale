export interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  clientOrigin: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
}
export declare function loadEnv(): EnvConfig;
//# sourceMappingURL=env.d.ts.map
