import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { User } from "../src/models/User";

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
      expect(response.body).toHaveProperty("message", "User registered successfully");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        username: "testuser",
        role: "reader",
      });
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should register a writer with specified role", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "writer2@example.com",
        username: "writeruser2",
        password: "password123",
        role: "writer",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("writer");
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
      const registerResponse = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const cookies = registerResponse.headers["set-cookie"];

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
