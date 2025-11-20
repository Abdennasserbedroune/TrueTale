import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { Book, FeedActivity, Follow, Story, User } from "../src/models";

interface AuthContext {
  token: string;
  userId: string;
}

describe("Feed Routes", () => {
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
    await Promise.all([
      Book.deleteMany({}),
      Story.deleteMany({}),
      User.deleteMany({}),
      Follow.deleteMany({}),
      FeedActivity.deleteMany({}),
    ]);
  });

  const registerUser = async (role: "writer" | "reader" = "writer"): Promise<AuthContext> => {
    const suffix = new mongoose.Types.ObjectId().toString();
    const response = await request(app).post("/api/auth/register").send({
      email: `${role}-${suffix}@example.com`,
      username: `${role}-${suffix}`,
      password: "password123",
      role,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");

    return {
      token: response.body.accessToken,
      userId: response.body.user.id,
    };
  };

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  const buildBookPayload = (overrides: Record<string, unknown> = {}) => ({
    title: "The Long Walk",
    description: "A compelling narrative about perseverance.",
    category: "Fiction",
    price: 12.99,
    genres: ["Drama", "Adventure"],
    language: "English",
    pages: 320,
    status: "published",
    ...overrides,
  });

  const buildStoryPayload = (overrides: Record<string, unknown> = {}) => ({
    title: "Midnight Musings",
    content: "A short story written under the glow of moonlight.",
    published: true,
    ...overrides,
  });

  describe("GET /api/feed - personal feed", () => {
    it("requires authentication", async () => {
      const response = await request(app).get("/api/feed");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("returns empty feed when user follows no one", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .get("/api/feed")
        .set(authHeader(reader.token));

      expect(response.status).toBe(200);
      expect(response.body.activities).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("returns activities from followed writers", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      // Reader follows writer
      await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      // Writer publishes a book
      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      const response = await request(app)
        .get("/api/feed")
        .set(authHeader(reader.token));

      expect(response.status).toBe(200);
      expect(response.body.activities.length).toBeGreaterThan(0);
      expect(response.body.activities[0].activityType).toBe("book_published");
      expect(response.body.activities[0].user.id).toBe(writer.userId);
    });

    it("excludes activities from unfollowed writers", async () => {
      const writer1 = await registerUser("writer");
      const writer2 = await registerUser("writer");
      const reader = await registerUser("reader");

      // Reader follows only writer1
      await request(app)
        .post(`/api/follow/${writer1.userId}`)
        .set(authHeader(reader.token));

      // Both writers publish books
      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer1.token))
        .send(buildBookPayload({ title: "Book by Writer 1" }));

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer2.token))
        .send(buildBookPayload({ title: "Book by Writer 2" }));

      const response = await request(app)
        .get("/api/feed")
        .set(authHeader(reader.token));

      expect(response.status).toBe(200);
      expect(response.body.activities.length).toBe(1);
      expect(response.body.activities[0].user.id).toBe(writer1.userId);
    });

    it("supports pagination", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      // Create multiple activities
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/writer/books")
          .set(authHeader(writer.token))
          .send(buildBookPayload({ title: `Book ${i}` }));
      }

      const page1 = await request(app)
        .get("/api/feed?page=1&limit=2")
        .set(authHeader(reader.token));

      expect(page1.status).toBe(200);
      expect(page1.body.activities.length).toBe(2);
      expect(page1.body.totalPages).toBe(3);

      const page2 = await request(app)
        .get("/api/feed?page=2&limit=2")
        .set(authHeader(reader.token));

      expect(page2.status).toBe(200);
      expect(page2.body.activities.length).toBe(2);
    });

    it("sorts activities by creation date (newest first)", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await request(app)
          .post("/api/writer/books")
          .set(authHeader(writer.token))
          .send(buildBookPayload({ title: `Book ${i}` }));
      }

      const response = await request(app)
        .get("/api/feed")
        .set(authHeader(reader.token));

      expect(response.status).toBe(200);
      expect(response.body.activities.length).toBe(3);

      for (let i = 0; i < response.body.activities.length - 1; i++) {
        const current = new Date(response.body.activities[i].createdAt).getTime();
        const next = new Date(response.body.activities[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("rejects invalid pagination parameters", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .get("/api/feed?page=0&limit=20")
        .set(authHeader(reader.token));

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/pagination/i);
    });
  });

  describe("GET /api/feed/global - global feed", () => {
    it("does not require authentication", async () => {
      const response = await request(app).get("/api/feed/global");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("activities");
    });

    it("returns activities from all writers", async () => {
      const writer1 = await registerUser("writer");
      const writer2 = await registerUser("writer");

      // Both writers publish books
      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer1.token))
        .send(buildBookPayload({ title: "Book 1" }));

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer2.token))
        .send(buildBookPayload({ title: "Book 2" }));

      const response = await request(app).get("/api/feed/global");

      expect(response.status).toBe(200);
      expect(response.body.activities.length).toBeGreaterThanOrEqual(2);
    });

    it("supports pagination on global feed", async () => {
      const writer = await registerUser("writer");

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/writer/books")
          .set(authHeader(writer.token))
          .send(buildBookPayload({ title: `Book ${i}` }));
      }

      const page1 = await request(app).get("/api/feed/global?page=1&limit=2");

      expect(page1.status).toBe(200);
      expect(page1.body.activities.length).toBe(2);
      expect(page1.body.totalPages).toBe(3);
    });

    it("returns empty global feed when no activities exist", async () => {
      const response = await request(app).get("/api/feed/global");

      expect(response.status).toBe(200);
      expect(response.body.activities).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe("activity creation hooks", () => {
    it("records book_published activity when book is published", async () => {
      const writer = await registerUser("writer");

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      const activities = await FeedActivity.find({ activityType: "book_published" });
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].metadata.title).toBe("The Long Walk");
    });

    it("records story_published activity when story is published", async () => {
      const writer = await registerUser("writer");

      await request(app)
        .post("/api/writer/stories")
        .set(authHeader(writer.token))
        .send(buildStoryPayload());

      const activities = await FeedActivity.find({ activityType: "story_published" });
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].metadata.title).toBe("Midnight Musings");
    });

    it("records follow_created activity when user follows writer", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      const activities = await FeedActivity.find({ activityType: "follow_created" });
      expect(activities.length).toBeGreaterThan(0);
    });

    it("records review_created activity when review is posted", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      // Writer publishes a book
      const bookResponse = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      const bookId = bookResponse.body.book.id;

      // Reader posts a review
      await request(app)
        .post(`/api/books/${bookId}/review`)
        .set(authHeader(reader.token))
        .send({
          rating: 5,
          reviewText: "Great book!",
        });

      const activities = await FeedActivity.find({ activityType: "review_created" });
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].metadata.rating).toBe(5);
    });

    it("includes metadata in activity records", async () => {
      const writer = await registerUser("writer");

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ title: "Test Book Title" }));

      const activity = await FeedActivity.findOne({ activityType: "book_published" });
      expect(activity?.metadata).toBeDefined();
      expect(activity?.metadata?.title).toBe("Test Book Title");
    });
  });
});
