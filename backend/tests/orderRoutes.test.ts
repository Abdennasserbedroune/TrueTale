import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { initializeDB, closeDB } from "../src/config/db";
import { Book, Order, User } from "../src/models";

interface AuthContext {
  token: string;
  userId: string;
}

describe("Order Routes", () => {
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
      Order.deleteMany({}),
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

  const createPublishedBook = async (writerId: string, price: number = 9.99) => {
    const book = new Book({
      title: "Test Book",
      description: "A test book for purchase",
      writerId: new mongoose.Types.ObjectId(writerId),
      category: "Fiction",
      price,
      status: "published",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();
    return book;
  };

  const createDraftBook = async (writerId: string) => {
    const book = new Book({
      title: "Draft Book",
      description: "A draft book",
      writerId: new mongoose.Types.ObjectId(writerId),
      category: "Fiction",
      price: 9.99,
      status: "draft",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();
    return book;
  };

  describe("GET /api/books/:id/checkout", () => {
    it("should return checkout information for a published book", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createPublishedBook(writer.userId);

      const response = await request(app)
        .get(`/api/books/${book._id}/checkout`)
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        book: {
          id: book._id.toString(),
          title: "Test Book",
          description: "A test book for purchase",
          price: 9.99,
        },
        writer: {
          id: writer.userId,
          username: writer.username,
        },
        isPurchased: false,
      });
    });

    it("should return 404 for non-existent book", async () => {
      const reader = await registerUser("reader");
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .get(`/api/books/${fakeId}/checkout`)
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: "Book not found",
      });
    });

    it("should return 403 for draft book", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createDraftBook(writer.userId);

      const response = await request(app)
        .get(`/api/books/${book._id}/checkout`)
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        message: "Book is not available for purchase",
      });
    });

    it("should return 401 without authentication", async () => {
      const writer = await registerUser("writer");
      const book = await createPublishedBook(writer.userId);

      const response = await request(app).get(`/api/books/${book._id}/checkout`);

      expect(response.status).toBe(401);
    });

    it("should show as purchased if user has paid order", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createPublishedBook(writer.userId);

      // Create a paid order
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book.price,
        status: "paid",
      }).save();

      const response = await request(app)
        .get(`/api/books/${book._id}/checkout`)
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body.isPurchased).toBe(true);
    });
  });

  describe("POST /api/orders", () => {
    it("should create a new order", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createPublishedBook(writer.userId);

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: book._id.toString() });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        bookId: book._id.toString(),
        writerId: writer.userId,
        price: 9.99,
        status: "pending",
      });
      expect(response.body).toHaveProperty("clientSecret");
      expect(response.body.clientSecret).toMatch(/^pi_/);
    });

    it("should update existing pending order instead of creating duplicate", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createPublishedBook(writer.userId);

      // Create initial pending order
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: 5.99, // Different price
        status: "pending",
      }).save();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: book._id.toString() });

      expect(response.status).toBe(201);
      expect(response.body.price).toBe(9.99); // Should be updated to current book price

      // Verify only one order exists
      const orderCount = await Order.countDocuments({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book._id,
      });
      expect(orderCount).toBe(1);
    });

    it("should return 409 if user already purchased the book", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createPublishedBook(writer.userId);

      // Create a paid order
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book.price,
        status: "paid",
      }).save();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: book._id.toString() });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        message: "You have already purchased this book",
      });
    });

    it("should return 404 for non-existent book", async () => {
      const reader = await registerUser("reader");
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: fakeId });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        message: "Book not found",
      });
    });

    it("should return 403 for draft book", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book = await createDraftBook(writer.userId);

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: book._id.toString() });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        message: "Book is not available for purchase",
      });
    });

    it("should return 401 without authentication", async () => {
      const writer = await registerUser("writer");
      const book = await createPublishedBook(writer.userId);

      const response = await request(app)
        .post("/api/orders")
        .send({ bookId: book._id.toString() });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid bookId", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${reader.token}`)
        .send({ bookId: "" });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        message: "Validation error",
      });
    });
  });

  describe("GET /api/user/orders", () => {
    it("should return user's orders", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book1 = await createPublishedBook(writer.userId, 9.99);
      const book2 = await createPublishedBook(writer.userId, 14.99);

      // Create orders
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book1._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book1.price,
        status: "pending",
      }).save();

      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book2._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book2.price,
        status: "paid",
      }).save();

      const response = await request(app)
        .get("/api/user/orders")
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0]).toMatchObject({
        price: 14.99,
        status: "paid",
      });
      expect(response.body.orders[1]).toMatchObject({
        price: 9.99,
        status: "pending",
      });
    });

    it("should return empty list for user with no orders", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .get("/api/user/orders")
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/user/orders");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/user/purchases", () => {
    it("should return user's paid purchases", async () => {
      const writer = await registerUser("writer");
      const reader = await registerUser("reader");
      const book1 = await createPublishedBook(writer.userId, 9.99);
      const book2 = await createPublishedBook(writer.userId, 14.99);

      // Create paid orders
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book1._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book1.price,
        status: "paid",
      }).save();

      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: book2._id,
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: book2.price,
        status: "paid",
      }).save();

      // Create pending order (should not be included)
      await new Order({
        userId: new mongoose.Types.ObjectId(reader.userId),
        bookId: new mongoose.Types.ObjectId(),
        writerId: new mongoose.Types.ObjectId(writer.userId),
        price: 19.99,
        status: "pending",
      }).save();

      const response = await request(app)
        .get("/api/user/purchases")
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
      expect(response.body.purchases).toHaveLength(2);
      expect(response.body.purchases[0]).toMatchObject({
        price: 14.99,
      });
      expect(response.body.purchases[1]).toMatchObject({
        price: 9.99,
      });
    });

    it("should return empty list for user with no purchases", async () => {
      const reader = await registerUser("reader");

      const response = await request(app)
        .get("/api/user/purchases")
        .set("Authorization", `Bearer ${reader.token}`);

      expect(response.status).toBe(200);
      expect(response.body.purchases).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/user/purchases");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/webhooks/stripe", () => {
    it("should accept webhook requests without authentication", async () => {
      const response = await request(app)
        .post("/api/webhooks/stripe")
        .send({ type: "test", data: { object: { id: "test" } } });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ received: true });
    });

    it("should handle empty webhook payload", async () => {
      const response = await request(app).post("/api/webhooks/stripe").send({});

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ received: true });
    });
  });
});