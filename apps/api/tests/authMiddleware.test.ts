import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express, { Express, Request, Response } from "express";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { TokenService } from "../src/utils/tokenService";
import { createAuthMiddleware } from "../src/middleware/authMiddleware";
import { User } from "../src/models/User";

describe("Auth Middleware", () => {
  let app: Express;
  let tokenService: TokenService;
  const config = loadEnv();

  beforeAll(async () => {
    await initializeDB(config);
    tokenService = new TokenService(config.jwtSecret, config.jwtRefreshSecret);

    const { requireAuth, requireRole } = createAuthMiddleware(tokenService);

    app = express();
    app.use(express.json());

    app.get("/protected", requireAuth, (req: Request, res: Response) => {
      res.json({ user: req.user });
    });

    app.get("/writer-only", requireAuth, requireRole("writer"), (req: Request, res: Response) => {
      res.json({ message: "Writer access granted" });
    });

    app.get(
      "/writer-or-reader",
      requireAuth,
      requireRole("writer", "reader"),
      (req: Request, res: Response) => {
        res.json({ message: "Access granted" });
      }
    );
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("requireAuth middleware", () => {
    it("should allow access with valid token", async () => {
      const user = new User({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
        role: "reader",
      });
      await user.save();

      const accessToken = tokenService.generateAccessToken(user);

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        userId: user._id.toString(),
        email: "test@example.com",
        username: "testuser",
        role: "reader",
      });
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/protected");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired token");
    });

    it("should reject request with malformed authorization header", async () => {
      const response = await request(app).get("/protected").set("Authorization", "InvalidFormat");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });
  });

  describe("requireRole middleware", () => {
    it("should allow writer to access writer-only route", async () => {
      const user = new User({
        email: "writer@example.com",
        username: "writeruser",
        password: "password123",
        role: "writer",
      });
      await user.save();

      const accessToken = tokenService.generateAccessToken(user);

      const response = await request(app)
        .get("/writer-only")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Writer access granted");
    });

    it("should deny reader access to writer-only route", async () => {
      const user = new User({
        email: "reader@example.com",
        username: "readeruser",
        password: "password123",
        role: "reader",
      });
      await user.save();

      const accessToken = tokenService.generateAccessToken(user);

      const response = await request(app)
        .get("/writer-only")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Access denied");
    });

    it("should allow both writer and reader to access multi-role route", async () => {
      const writer = new User({
        email: "writer@example.com",
        username: "writeruser",
        password: "password123",
        role: "writer",
      });
      await writer.save();

      const reader = new User({
        email: "reader@example.com",
        username: "readeruser",
        password: "password123",
        role: "reader",
      });
      await reader.save();

      const writerToken = tokenService.generateAccessToken(writer);
      const readerToken = tokenService.generateAccessToken(reader);

      const writerResponse = await request(app)
        .get("/writer-or-reader")
        .set("Authorization", `Bearer ${writerToken}`);

      expect(writerResponse.status).toBe(200);

      const readerResponse = await request(app)
        .get("/writer-or-reader")
        .set("Authorization", `Bearer ${readerToken}`);

      expect(readerResponse.status).toBe(200);
    });
  });
});
