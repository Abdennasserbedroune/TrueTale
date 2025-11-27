import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { User, Follow, Book } from "@truetale/db";

describe("Profile Routes", () => {
  let app: Express;
  const config = loadEnv();
  let accessToken: string;
  let userId: string;
  let username: string;

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
    await Follow.deleteMany({});
    await Book.deleteMany({});

    const registerResponse = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });

    userId = registerResponse.body.userId;
    username = "testuser";

    await User.findByIdAndUpdate(userId, { isVerified: true });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    accessToken = loginResponse.body.accessToken;
  });

  describe("GET /api/users/:username - Get Public Profile", () => {
    it("should get public profile by username", async () => {
      await User.findByIdAndUpdate(userId, {
        name: "Test User",
        bio: "Test bio",
        location: "Test City",
      });

      const response = await request(app).get(`/api/users/${username}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(username);
      expect(response.body.name).toBe("Test User");
      expect(response.body.bio).toBe("Test bio");
      expect(response.body.location).toBe("Test City");
      expect(response.body).toHaveProperty("followers");
      expect(response.body).toHaveProperty("following");
      expect(response.body).toHaveProperty("bookCount");
      expect(response.body).not.toHaveProperty("email");
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app).get("/api/users/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should include correct follower and book counts", async () => {
      const anotherUser = await User.create({
        email: "another@example.com",
        username: "another",
        password: "password123",
        isVerified: true,
      });

      await Follow.create({
        followerId: anotherUser._id,
        followingId: userId,
      });

      await Book.create({
        title: "Test Book",
        description: "Test description",
        writerId: userId,
        category: "Fiction",
        price: 999,
        status: "published",
        genres: ["Fantasy"],
        language: "English",
        pages: 200,
      });

      const response = await request(app).get(`/api/users/${username}`);

      expect(response.status).toBe(200);
      expect(response.body.followers).toBe(1);
      expect(response.body.following).toBe(0);
      expect(response.body.bookCount).toBe(1);
    });
  });

  describe("GET /api/users - Get Private Profile", () => {
    it("should get private profile for authenticated user", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("test@example.com");
      expect(response.body.username).toBe(username);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/users - Update Profile", () => {
    it("should update profile fields", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated Name",
          bio: "Updated bio",
          location: "New City",
          socials: {
            twitter: "testuser",
            website: "https://example.com",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
      expect(response.body.bio).toBe("Updated bio");
      expect(response.body.location).toBe("New City");
      expect(response.body.socials.twitter).toBe("testuser");
      expect(response.body.socials.website).toBe("https://example.com");
    });

    it("should reject bio longer than 500 characters", async () => {
      const longBio = "a".repeat(501);

      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          bio: longBio,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Bio too long (max 500 chars)");
    });

    it("should update notification preferences", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          notificationPreferences: {
            emailUpdates: false,
            newFollowers: true,
            bookReviews: false,
            orderNotifications: true,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.notificationPreferences.emailUpdates).toBe(false);
      expect(response.body.notificationPreferences.newFollowers).toBe(true);
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).put("/api/users").send({
        name: "Test",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/users/avatar - Update Avatar", () => {
    it("should update avatar URL", async () => {
      const response = await request(app)
        .put("/api/users/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          avatarUrl: "https://example.com/avatar.jpg",
        });

      expect(response.status).toBe(200);
      expect(response.body.avatar).toBe("https://example.com/avatar.jpg");
    });

    it("should return 400 without avatar URL", async () => {
      const response = await request(app)
        .put("/api/users/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Avatar URL required");
    });
  });

  describe("PUT /api/users/email - Change Email", () => {
    it("should change email and reset verification", async () => {
      const response = await request(app)
        .put("/api/users/email")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          newEmail: "newemail@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("Check your new email for verification");

      const user = await User.findById(userId);
      expect(user?.email).toBe("newemail@example.com");
      expect(user?.isVerified).toBe(false);
      expect(user?.verificationToken).toBeTruthy();
    });

    it("should reject duplicate email", async () => {
      await User.create({
        email: "existing@example.com",
        username: "existing",
        password: "password123",
      });

      const response = await request(app)
        .put("/api/users/email")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          newEmail: "existing@example.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email already in use");
    });

    it("should return 400 without new email", async () => {
      const response = await request(app)
        .put("/api/users/email")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("New email required");
    });
  });

  describe("PUT /api/users/password - Change Password", () => {
    it("should change password and invalidate refresh tokens", async () => {
      const response = await request(app)
        .put("/api/users/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "password123",
          newPassword: "newpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("Password changed");

      const user = await User.findById(userId);
      expect(user?.refreshTokens.length).toBe(0);

      const validPassword = await user?.comparePassword("newpassword123");
      expect(validPassword).toBe(true);
    });

    it("should reject incorrect old password", async () => {
      const response = await request(app)
        .put("/api/users/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "wrongpassword",
          newPassword: "newpassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Current password incorrect");
    });

    it("should reject password shorter than 6 characters", async () => {
      const response = await request(app)
        .put("/api/users/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "password123",
          newPassword: "12345",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("at least 6 characters");
    });

    it("should return 400 without both passwords", async () => {
      const response = await request(app)
        .put("/api/users/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Both passwords required");
    });
  });

  describe("PUT /api/users/role - Update Role", () => {
    it("should update user role to writer", async () => {
      const response = await request(app)
        .put("/api/users/role")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          role: "writer",
        });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe("writer");
    });

    it("should reject invalid role", async () => {
      const response = await request(app)
        .put("/api/users/role")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          role: "admin",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid role");
    });
  });

  describe("DELETE /api/users - Request Account Deletion", () => {
    it("should schedule account for deletion", async () => {
      const response = await request(app)
        .delete("/api/users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("30 days");

      const user = await User.findById(userId);
      expect(user?.deletionRequestedAt).toBeTruthy();
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).delete("/api/users");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/users/cancel-deletion - Cancel Deletion Request", () => {
    it("should cancel deletion request", async () => {
      await User.findByIdAndUpdate(userId, {
        deletionRequestedAt: new Date(),
      });

      const response = await request(app)
        .post("/api/users/cancel-deletion")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("cancelled");

      const user = await User.findById(userId);
      expect(user?.deletionRequestedAt).toBeNull();
    });
  });
});
