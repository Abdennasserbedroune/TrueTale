import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { EnvConfig } from "../src/config/env";

describe("Health endpoint", () => {
  it("should return 200 status with ok message", async () => {
    const config: EnvConfig = {
      port: 5000,
      nodeEnv: "test",
      mongoUri: "mongodb://localhost:27017/test",
      clientOrigin: "http://localhost:3000",
      jwtSecret: "test-secret",
      jwtRefreshSecret: "test-refresh-secret",
    };

    const { app } = createApp(config);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
