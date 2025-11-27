import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { Book, Draft, Story, User } from "../src/models";

interface AuthContext {
  token: string;
  userId: string;
}

describe("Writer Routes", () => {
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
      Draft.deleteMany({}),
      Story.deleteMany({}),
      User.deleteMany({}),
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
    ...overrides,
  });

  const buildDraftPayload = (overrides: Record<string, unknown> = {}) => ({
    title: "Chapter One",
    content: "This is the opening chapter of the next bestseller.",
    ...overrides,
  });

  const buildStoryPayload = (overrides: Record<string, unknown> = {}) => ({
    title: "Midnight Musings",
    content: "A short story written under the glow of moonlight.",
    ...overrides,
  });

  describe("authentication and authorization", () => {
    it("rejects requests without an access token", async () => {
      const response = await request(app).get("/api/writer/books");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided");
    });

    it("blocks readers from accessing writer endpoints", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .get("/api/writer/books")
        .set(authHeader(reader.token));

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Access denied/i);
    });
  });

  describe("books", () => {
    it("creates a book with draft status by default", async () => {
      const writer = await registerUser();

      const response = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      expect(response.status).toBe(201);
      expect(response.body.book.status).toBe("draft");

      const savedBook = await Book.findById(response.body.book.id);
      expect(savedBook).not.toBeNull();
      expect(savedBook?.status).toBe("draft");
    });

    it("allows publishing a book during creation", async () => {
      const writer = await registerUser();

      const response = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ status: "published" }));

      expect(response.status).toBe(201);
      expect(response.body.book.status).toBe("published");
      expect(response.body.book.publishedAt).toBeTruthy();

      const savedBook = await Book.findById(response.body.book.id);
      expect(savedBook?.status).toBe("published");
      expect(savedBook?.publishedAt).toBeInstanceOf(Date);
    });

    it("updates book metadata and publishes the book", async () => {
      const writer = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      const bookId = createResponse.body.book.id;

      const updateResponse = await request(app)
        .put(`/api/writer/books/${bookId}`)
        .set(authHeader(writer.token))
        .send({ status: "published", price: 15.5 });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.book.status).toBe("published");
      expect(updateResponse.body.book.price).toBe(15.5);
      expect(updateResponse.body.book.publishedAt).toBeTruthy();

      const updatedBook = await Book.findById(bookId);
      expect(updatedBook?.status).toBe("published");
      expect(updatedBook?.publishedAt).toBeInstanceOf(Date);
    });

    it("prevents non-owners from editing a book", async () => {
      const owner = await registerUser();
      const otherWriter = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/books")
        .set(authHeader(owner.token))
        .send(buildBookPayload());

      const response = await request(app)
        .put(`/api/writer/books/${createResponse.body.book.id}`)
        .set(authHeader(otherWriter.token))
        .send({ title: "Unauthorized change" });

      expect(response.status).toBe(403);
    });

    it("deletes a book that belongs to the writer", async () => {
      const writer = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload());

      const bookId = createResponse.body.book.id;

      const deleteResponse = await request(app)
        .delete(`/api/writer/books/${bookId}`)
        .set(authHeader(writer.token));

      expect(deleteResponse.status).toBe(204);

      const deleted = await Book.findById(bookId);
      expect(deleted).toBeNull();
    });

    it("returns only published books with pagination", async () => {
      const writer = await registerUser();

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ status: "published", title: "Book 1" }));

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ status: "published", title: "Book 2" }));

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ status: "draft", title: "Draft Book" }));

      const response = await request(app)
        .get("/api/writer/books?page=1&limit=2")
        .set(authHeader(writer.token));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      response.body.data.forEach((book: { status: string }) => {
        expect(book.status).toBe("published");
      });
    });

    it("validates book payloads", async () => {
      const writer = await registerUser();

      const response = await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send({ title: "Incomplete" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation error");
    });
  });

  describe("drafts", () => {
    it("lists, creates, updates, and deletes drafts", async () => {
      const writer = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/drafts")
        .set(authHeader(writer.token))
        .send(buildDraftPayload());

      expect(createResponse.status).toBe(201);
      const draftId = createResponse.body.draft.id;

      const listResponse = await request(app)
        .get("/api/writer/drafts")
        .set(authHeader(writer.token));

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);

      const updateResponse = await request(app)
        .put(`/api/writer/drafts/${draftId}`)
        .set(authHeader(writer.token))
        .send({ content: "Updated draft content." });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.draft.wordCount).toBe(3);

      const deleteResponse = await request(app)
        .delete(`/api/writer/drafts/${draftId}`)
        .set(authHeader(writer.token));

      expect(deleteResponse.status).toBe(204);
      const deleted = await Draft.findById(draftId);
      expect(deleted).toBeNull();
    });

    it("prevents non-owners from deleting drafts", async () => {
      const owner = await registerUser();
      const otherWriter = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/drafts")
        .set(authHeader(owner.token))
        .send(buildDraftPayload());

      const deleteResponse = await request(app)
        .delete(`/api/writer/drafts/${createResponse.body.draft.id}`)
        .set(authHeader(otherWriter.token));

      expect(deleteResponse.status).toBe(403);
    });
  });

  describe("stories", () => {
    it("creates and lists stories, defaulting to published", async () => {
      const writer = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/stories")
        .set(authHeader(writer.token))
        .send(buildStoryPayload());

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.story.published).toBe(true);

      const listResponse = await request(app)
        .get("/api/writer/stories")
        .set(authHeader(writer.token));

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
    });

    it("prevents non-owners from deleting stories", async () => {
      const owner = await registerUser();
      const otherWriter = await registerUser();

      const createResponse = await request(app)
        .post("/api/writer/stories")
        .set(authHeader(owner.token))
        .send(buildStoryPayload());

      const deleteResponse = await request(app)
        .delete(`/api/writer/stories/${createResponse.body.story.id}`)
        .set(authHeader(otherWriter.token));

      expect(deleteResponse.status).toBe(403);
    });
  });

  describe("profile", () => {
    it("returns writer profile with aggregated stats", async () => {
      const writer = await registerUser();

      await request(app)
        .post("/api/writer/books")
        .set(authHeader(writer.token))
        .send(buildBookPayload({ status: "published" }));

      await request(app)
        .post("/api/writer/drafts")
        .set(authHeader(writer.token))
        .send(buildDraftPayload());

      await request(app)
        .post("/api/writer/stories")
        .set(authHeader(writer.token))
        .send(buildStoryPayload());

      const response = await request(app)
        .get("/api/writer/profile")
        .set(authHeader(writer.token));

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBeTruthy();
      expect(response.body.stats.books.published).toBe(1);
      expect(response.body.stats.drafts).toBe(1);
      expect(response.body.stats.stories).toBe(1);
    });

    it("updates writer profile details", async () => {
      const writer = await registerUser();

      const updateResponse = await request(app)
        .put("/api/writer/profile")
        .set(authHeader(writer.token))
        .send({
          bio: "Award-winning novelist.",
          avatar: "https://example.com/avatar.png",
          socials: {
            website: "https://author.example.com",
            twitter: "https://twitter.com/author",
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.profile.bio).toBe("Award-winning novelist.");
      expect(updateResponse.body.profile.avatar).toBe("https://example.com/avatar.png");
      expect(updateResponse.body.profile.socials.website).toBe("https://author.example.com");

      const user = await User.findById(writer.userId);
      expect(user?.bio).toBe("Award-winning novelist.");
      expect(user?.avatar).toBe("https://example.com/avatar.png");
      expect(user?.socials?.website).toBe("https://author.example.com");
    });
  });
});
