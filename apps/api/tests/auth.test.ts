import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { User } from "@truetale/db";

describe("Auth Module", () => {
  let app: Express;
  const config = loadEnv();

  beforeAll(async () => {
    await initializeDB(config);
    const appData = createApp(config);
    app = appData.app;
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user with valid data", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("Registration successful");
      expect(response.body).toHaveProperty("userId");
      expect(response.body).not.toHaveProperty("accessToken");

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();
      expect(user?.isVerified).toBe(false);
      expect(user?.verificationToken).toBeTruthy();
    });

    it("should register a writer with specified role", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "writer2@example.com",
        username: "writeruser2",
        password: "password123",
        role: "writer",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("Registration successful");

      const user = await User.findOne({ email: "writer2@example.com" });
      expect(user?.role).toBe("writer");
    });

    it("should reject registration with duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "user1",
        password: "password123",
      });

      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "user2",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email already registered");
    });

    it("should reject registration with duplicate username", async () => {
      await request(app).post("/api/auth/register").send({
        email: "user1@example.com",
        username: "testuser",
        password: "password123",
      });

      const response = await request(app).post("/api/auth/register").send({
        email: "user2@example.com",
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Username already taken");
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        username: "testuser",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation error");
    });

    it("should reject registration with short password", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "12345",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation error");
    });

    it("should reject registration with short username", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "ab",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation error");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.isVerified = true;
        await user.save();
      }
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        username: "testuser",
      });
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should reject login with unverified email", async () => {
      await User.deleteMany({});
      await request(app).post("/api/auth/register").send({
        email: "unverified@example.com",
        username: "unverifieduser",
        password: "password123",
      });

      const response = await request(app).post("/api/auth/login").send({
        email: "unverified@example.com",
        password: "password123",
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("verify your email");
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "wrong@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject login with missing password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation error");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear refresh token cookie", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logout successful");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.isVerified = true;
        await user.save();
      }

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app).post("/api/auth/refresh").set("Cookie", cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Token refreshed successfully");
      expect(response.body).toHaveProperty("accessToken");
    });

    it("should reject refresh without refresh token", async () => {
      const response = await request(app).post("/api/auth/refresh");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No refresh token provided");
    });
  });

  describe("POST /api/auth/verify", () => {
    it("should verify email with valid token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();
      expect(user?.isVerified).toBe(false);

      const verificationToken = user?.verificationToken;

      const response = await request(app).post("/api/auth/verify").send({
        token: verificationToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("verified successfully");

      const updatedUser = await User.findOne({ email: "test@example.com" });
      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.verificationToken).toBeUndefined();
    });

    it("should reject verification with invalid token", async () => {
      const response = await request(app).post("/api/auth/verify").send({
        token: "invalid-token",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid or expired");
    });

    it("should reject verification with expired token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.verificationExpires = new Date(Date.now() - 1000);
        await user.save();
      }

      const response = await request(app).post("/api/auth/verify").send({
        token: user?.verificationToken,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid or expired");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.isVerified = true;
        await user.save();
      }

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        username: "testuser",
      });
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("No token provided");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/forgot", () => {
    it("should send password reset email for existing user", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const response = await request(app).post("/api/auth/forgot").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("password reset link");

      const user = await User.findOne({ email: "test@example.com" });
      expect(user?.resetToken).toBeTruthy();
      expect(user?.resetExpires).toBeTruthy();
    });

    it("should return success even for non-existent email", async () => {
      const response = await request(app).post("/api/auth/forgot").send({
        email: "nonexistent@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("password reset link");
    });
  });

  describe("POST /api/auth/reset", () => {
    it("should reset password with valid token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.isVerified = true;
        await user.save();
      }

      await request(app).post("/api/auth/forgot").send({
        email: "test@example.com",
      });

      const updatedUser = await User.findOne({ email: "test@example.com" });
      const resetToken = updatedUser?.resetToken;

      const response = await request(app).post("/api/auth/reset").send({
        token: resetToken,
        newPassword: "newpassword123",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("Password reset successful");

      const finalUser = await User.findOne({ email: "test@example.com" });
      expect(finalUser?.resetToken).toBeUndefined();

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "newpassword123",
      });

      expect(loginResponse.status).toBe(200);
    });

    it("should reject reset with invalid token", async () => {
      const response = await request(app).post("/api/auth/reset").send({
        token: "invalid-token",
        newPassword: "newpassword123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid or expired");
    });

    it("should reject reset with expired token", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      await request(app).post("/api/auth/forgot").send({
        email: "test@example.com",
      });

      const user = await User.findOne({ email: "test@example.com" });
      if (user) {
        user.resetExpires = new Date(Date.now() - 1000);
        await user.save();
      }

      const response = await request(app).post("/api/auth/reset").send({
        token: user?.resetToken,
        newPassword: "newpassword123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid or expired");
    });
  });

  describe("Password Hashing", () => {
    it("should hash password before saving to database", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe("password123");
      expect(user?.password).toMatch(/^\$2[aby]\$/);
    });

    it("should compare passwords correctly", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).toBeTruthy();

      if (user) {
        const isValid = await user.comparePassword("password123");
        expect(isValid).toBe(true);

        const isInvalid = await user.comparePassword("wrongpassword");
        expect(isInvalid).toBe(false);
      }
    });
  });
});
