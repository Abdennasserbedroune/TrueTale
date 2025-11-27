import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { Book, Follow, Review, User } from "../src/models";

interface AuthContext {
  token: string;
  userId: string;
}

describe("Reader Routes", () => {
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
      Review.deleteMany({}),
      Follow.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  const registerUser = async (role: "reader" | "writer" = "reader"): Promise<AuthContext> => {
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

  const createBook = async (
    writerId: string,
    overrides: Partial<{
      title: string;
      description: string;
      category: string;
      price: number;
      status: "draft" | "published";
      genres: string[];
      language: string;
      pages: number;
    }> = {}
  ) => {
    const book = new Book({
      title: overrides.title ?? "Sample Book",
      description: overrides.description ?? "A compelling story awaits.",
      writerId: new mongoose.Types.ObjectId(writerId),
      category: overrides.category ?? "Fiction",
      price: overrides.price ?? 12.5,
      status: overrides.status ?? "published",
      genres: overrides.genres ?? ["Fiction"],
      language: overrides.language ?? "English",
      pages: overrides.pages ?? 320,
    });

    await book.save();
    return book;
  };

  describe("public book browsing", () => {
    it("returns only published books with writer summaries", async () => {
      const writer = await registerUser("writer");

      const publishedBook = await createBook(writer.userId, { title: "Published Book" });
      await createBook(writer.userId, { title: "Draft Book", status: "draft" });

      const response = await request(app).get("/api/books");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(publishedBook._id.toString());
      expect(response.body.data[0].writer.id).toBe(writer.userId);
      expect(response.body.pagination.total).toBe(1);
    });

    it("supports pagination and filtering", async () => {
      const writer = await registerUser("writer");

      await createBook(writer.userId, { title: "Mystery One", category: "Mystery" });
      await createBook(writer.userId, { title: "Mystery Two", category: "Mystery" });
      await createBook(writer.userId, { title: "Sci-Fi", category: "Science Fiction" });

      const response = await request(app).get("/api/books?page=1&limit=2&category=Mystery");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      response.body.data.forEach((book: { category: string }) => {
        expect(book.category).toBe("Mystery");
      });
    });

    it("provides book detail with aggregated reviews", async () => {
      const writer = await registerUser("writer");
      const readerOne = await registerUser("reader");
      const readerTwo = await registerUser("reader");

      const book = await createBook(writer.userId, { title: "Detail Book" });

      const reviewOne = new Review({
        userId: new mongoose.Types.ObjectId(readerOne.userId),
        bookId: book._id,
        rating: 5,
        reviewText: "Incredible read!",
      });
      await reviewOne.save();

      const reviewTwo = new Review({
        userId: new mongoose.Types.ObjectId(readerTwo.userId),
        bookId: book._id,
        rating: 4,
        reviewText: "Great, but pacing was slow in the middle.",
      });
      await reviewTwo.save();

      const response = await request(app).get(`/api/books/${book._id.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body.book.id).toBe(book._id.toString());
      expect(response.body.book.writer.id).toBe(writer.userId);
      expect(response.body.reviews.stats.reviewCount).toBe(2);
      expect(response.body.reviews.stats.averageRating).toBeCloseTo(4.5, 1);
      expect(response.body.reviews.data[0].user).toHaveProperty("username");
    });
  });

  describe("reviews", () => {
    it("requires authentication for review creation", async () => {
      const writer = await registerUser("writer");
      const book = await createBook(writer.userId);

      const response = await request(app).post(`/api/books/${book._id.toString()}/review`).send({
        rating: 5,
        reviewText: "Loved it!",
      });

      expect(response.status).toBe(401);
    });

    it("creates, updates, lists, and deletes reader reviews", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createBook(writer.userId, { title: "Reviewable" });

      const createResponse = await request(app)
        .post(`/api/books/${book._id.toString()}/review`)
        .set(authHeader(reader.token))
        .send({ rating: 4, reviewText: "Engaging and thoughtful." });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.review.rating).toBe(4);

      const reviewId = createResponse.body.review.id;

      const updateResponse = await request(app)
        .post(`/api/books/${book._id.toString()}/review`)
        .set(authHeader(reader.token))
        .send({ rating: 5, reviewText: "Even better on the second read." });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.review.rating).toBe(5);

      const listResponse = await request(app)
        .get("/api/reviews")
        .set(authHeader(reader.token));

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0].book.id).toBe(book._id.toString());

      const putResponse = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set(authHeader(reader.token))
        .send({ reviewText: "Updated thoughts after a week." });

      expect(putResponse.status).toBe(200);
      expect(putResponse.body.review.reviewText).toContain("Updated thoughts");

      const deleteResponse = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set(authHeader(reader.token));

      expect(deleteResponse.status).toBe(204);

      const bookAfterDelete = await Book.findById(book._id);
      expect(bookAfterDelete?.reviewCount).toBe(0);
    });

    it("prevents writers from reviewing their own books", async () => {
      const writer = await registerUser("writer");
      const book = await createBook(writer.userId);

      const response = await request(app)
        .post(`/api/books/${book._id.toString()}/review`)
        .set(authHeader(writer.token))
        .send({ rating: 5, reviewText: "Self praise" });

      expect(response.status).toBe(403);
    });
  });

  describe("follows", () => {
    it("allows readers to follow and unfollow writers with idempotency", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");

      const followResponse = await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      expect(followResponse.status).toBe(200);
      expect(followResponse.body.following).toBe(true);
      expect(followResponse.body.followersCount).toBe(1);

      const repeatFollowResponse = await request(app)
        .post(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      expect(repeatFollowResponse.status).toBe(200);
      expect(
        await Follow.countDocuments({
          followerId: new mongoose.Types.ObjectId(reader.userId),
          followingId: new mongoose.Types.ObjectId(writer.userId),
        })
      ).toBe(1);

      const followingListResponse = await request(app)
        .get("/api/following")
        .set(authHeader(reader.token));

      expect(followingListResponse.status).toBe(200);
      expect(followingListResponse.body.data).toHaveLength(1);
      expect(followingListResponse.body.data[0].writer.id).toBe(writer.userId);

      const unfollowResponse = await request(app)
        .delete(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      expect(unfollowResponse.status).toBe(200);
      expect(unfollowResponse.body.following).toBe(false);
      expect(unfollowResponse.body.followersCount).toBe(0);

      const repeatUnfollowResponse = await request(app)
        .delete(`/api/follow/${writer.userId}`)
        .set(authHeader(reader.token));

      expect(repeatUnfollowResponse.status).toBe(200);
      expect(
        await Follow.countDocuments({
          followerId: new mongoose.Types.ObjectId(reader.userId),
          followingId: new mongoose.Types.ObjectId(writer.userId),
        })
      ).toBe(0);
    });
  });

  describe("reader profile", () => {
    it("requires authentication", async () => {
      const response = await request(app).get("/api/reader/profile");
      expect(response.status).toBe(401);
    });

    it("returns and updates reader profile details", async () => {
      const reader = await registerUser("reader");

      const profileResponse = await request(app)
        .get("/api/reader/profile")
        .set(authHeader(reader.token));

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.profile.id).toBe(reader.userId);
      expect(profileResponse.body.stats.followers).toBe(0);

      const updateResponse = await request(app)
        .put("/api/reader/profile")
        .set(authHeader(reader.token))
        .send({
          profile: "Voracious reader",
          bio: "Exploring new worlds every day.",
          socials: {
            website: "https://reader.example.com",
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.profile.profile).toBe("Voracious reader");
      expect(updateResponse.body.profile.bio).toBe("Exploring new worlds every day.");

      const updatedUser = await User.findById(reader.userId);
      expect(updatedUser?.bio).toBe("Exploring new worlds every day.");
    });

    it("does not allow writers to overwrite writer-specific profile fields", async () => {
      const writer = await registerUser("writer");
      const writerUser = await User.findById(writer.userId);

      if (!writerUser) {
        throw new Error("Expected writer to exist");
      }

      writerUser.profile = "Original tagline";
      writerUser.bio = "Award-winning author.";
      await writerUser.save();

      const response = await request(app)
        .put("/api/reader/profile")
        .set(authHeader(writer.token))
        .send({
          profile: "New tagline",
          bio: "Updated bio for readers.",
        });

      expect(response.status).toBe(200);
      expect(response.body.profile.profile).toBe("Original tagline");
      expect(response.body.profile.bio).toBe("Updated bio for readers.");

      const refreshedWriter = await User.findById(writer.userId);
      expect(refreshedWriter?.profile).toBe("Original tagline");
      expect(refreshedWriter?.bio).toBe("Updated bio for readers.");
    });
  });
});
