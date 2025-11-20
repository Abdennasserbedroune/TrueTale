import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeEach, afterEach, describe, it, expect, beforeAll, afterAll } from "vitest";
import { User, Book, Draft, Story, Review, Follow, FeedActivity } from "../src/models";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Draft.deleteMany({}),
    Story.deleteMany({}),
    Review.deleteMany({}),
    Follow.deleteMany({}),
    FeedActivity.deleteMany({}),
  ]);
});

describe("Book Schema", () => {
  it("should create a book with valid fields", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user._id,
      category: "Fiction",
      price: 10.99,
      status: "draft",
      genres: ["Fiction", "Adventure"],
      language: "English",
      pages: 200,
    });

    const savedBook = await book.save();
    expect(savedBook.title).toBe("Test Book");
    expect(savedBook.averageRating).toBe(0);
    expect(savedBook.reviewCount).toBe(0);
  });

  it("should set publishedAt when status changes to published", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user._id,
      category: "Fiction",
      price: 10.99,
      status: "draft",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();

    expect(book.publishedAt).toBeUndefined();

    book.status = "published";
    await book.save();

    expect(book.publishedAt).toBeInstanceOf(Date);
  });

  it("should enforce required fields", async () => {
    const book = new Book({});
    
    await expect(book.save()).rejects.toThrow();
  });

  it("should enforce price minimum", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user._id,
      category: "Fiction",
      price: -5,
      status: "draft",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });

    await expect(book.save()).rejects.toThrow();
  });

  it("should enforce genres array validation", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user._id,
      category: "Fiction",
      price: 10.99,
      status: "draft",
      genres: [], // Empty array should fail
      language: "English",
      pages: 200,
    });

    await expect(book.save()).rejects.toThrow();
  });
});

describe("Draft Schema", () => {
  it("should calculate word count on save", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const draft = new Draft({
      writerId: user._id,
      title: "Test Draft",
      content: "This is a test draft with seven words in total.",
      wordCount: 0, // Should be calculated automatically
    });

    const savedDraft = await draft.save();
    expect(savedDraft.wordCount).toBe(10); // Should count 10 words
  });

  it("should enforce required fields", async () => {
    const draft = new Draft({});
    
    await expect(draft.save()).rejects.toThrow();
  });
});

describe("Story Schema", () => {
  it("should create a story with valid fields", async () => {
    const user = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await user.save();

    const story = new Story({
      writerId: user._id,
      title: "Test Story",
      content: "This is a test story content.",
      published: false,
    });

    const savedStory = await story.save();
    expect(savedStory.title).toBe("Test Story");
    expect(savedStory.published).toBe(false);
  });

  it("should enforce required fields", async () => {
    const story = new Story({});
    
    await expect(story.save()).rejects.toThrow();
  });
});

describe("Review Schema", () => {
  let user: any;
  let book: any;

  beforeEach(async () => {
    user = new User({
      email: "reader@example.com",
      username: "reader",
      password: "password123",
      role: "reader",
    });
    await user.save();

    const writer = new User({
      email: "writer@example.com",
      username: "writer",
      password: "password123",
      role: "writer",
    });
    await writer.save();

    book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: writer._id,
      category: "Fiction",
      price: 10.99,
      status: "published",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();
  });

  it("should create a review with valid fields", async () => {
    const review = new Review({
      userId: user._id,
      bookId: book._id,
      rating: 5,
      reviewText: "Excellent book!",
    });

    const savedReview = await review.save();
    expect(savedReview.rating).toBe(5);
    expect(savedReview.reviewText).toBe("Excellent book!");
  });

  it("should enforce rating range", async () => {
    const review = new Review({
      userId: user._id,
      bookId: book._id,
      rating: 6, // Invalid rating
      reviewText: "Excellent book!",
    });

    await expect(review.save()).rejects.toThrow();
  });

  it("should enforce unique compound index (userId, bookId)", async () => {
    const review1 = new Review({
      userId: user._id,
      bookId: book._id,
      rating: 5,
      reviewText: "Excellent book!",
    });
    await review1.save();

    const review2 = new Review({
      userId: user._id,
      bookId: book._id,
      rating: 4,
      reviewText: "Good book!",
    });

    await expect(review2.save()).rejects.toThrow();
  });

  it("should update book rating counts after review save", async () => {
    const review = new Review({
      userId: user._id,
      bookId: book._id,
      rating: 5,
      reviewText: "Excellent book!",
    });
    await review.save();

    // Refresh book from database
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook?.averageRating).toBe(5);
    expect(updatedBook?.reviewCount).toBe(1);
  });
});

describe("Follow Schema", () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    user1 = new User({
      email: "user1@example.com",
      username: "user1",
      password: "password123",
      role: "reader",
    });
    await user1.save();

    user2 = new User({
      email: "user2@example.com",
      username: "user2",
      password: "password123",
      role: "writer",
    });
    await user2.save();
  });

  it("should create a follow relationship", async () => {
    const follow = new Follow({
      followerId: user1._id,
      followingId: user2._id,
    });

    const savedFollow = await follow.save();
    expect(savedFollow.followerId.toString()).toBe(user1._id.toString());
    expect(savedFollow.followingId.toString()).toBe(user2._id.toString());
  });

  it("should enforce unique compound index (followerId, followingId)", async () => {
    const follow1 = new Follow({
      followerId: user1._id,
      followingId: user2._id,
    });
    await follow1.save();

    const follow2 = new Follow({
      followerId: user1._id,
      followingId: user2._id,
    });

    await expect(follow2.save()).rejects.toThrow();
  });
});

describe("FeedActivity Schema", () => {
  let user: any;
  let book: any;

  beforeEach(async () => {
    user = new User({
      email: "user@example.com",
      username: "user",
      password: "password123",
      role: "writer",
    });
    await user.save();

    book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user._id,
      category: "Fiction",
      price: 10.99,
      status: "published",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();
  });

  it("should create a feed activity", async () => {
    const activity = new FeedActivity({
      userId: user._id,
      activityType: "book_published",
      targetId: book._id,
      metadata: { bookTitle: "Test Book" },
    });

    const savedActivity = await activity.save();
    expect(savedActivity.activityType).toBe("book_published");
    expect(savedActivity.metadata?.bookTitle).toBe("Test Book");
  });

  it("should enforce valid activity types", async () => {
    const activity = new FeedActivity({
      userId: user._id,
      activityType: "invalid_type", // Invalid activity type
      targetId: book._id,
    });

    await expect(activity.save()).rejects.toThrow();
  });

  it("should enforce required fields", async () => {
    const activity = new FeedActivity({});
    
    await expect(activity.save()).rejects.toThrow();
  });
});

describe("Static Methods", () => {
  let user1: any;
  let user2: any;
  let book: any;

  beforeEach(async () => {
    user1 = new User({
      email: "user1@example.com",
      username: "user1",
      password: "password123",
      role: "reader",
    });
    await user1.save();

    user2 = new User({
      email: "user2@example.com",
      username: "user2",
      password: "password123",
      role: "writer",
    });
    await user2.save();

    book = new Book({
      title: "Test Book",
      description: "A test book description",
      writerId: user2._id,
      category: "Fiction",
      price: 10.99,
      status: "published",
      genres: ["Fiction"],
      language: "English",
      pages: 200,
    });
    await book.save();
  });

  it("should create follow relationship and check with isFollowing", async () => {
    const follow = new Follow({
      followerId: user1._id,
      followingId: user2._id,
    });
    await follow.save();

    const isFollowing = await Follow.isFollowing(user1._id, user2._id);
    expect(isFollowing).toBeTruthy();
  });

  it("should get follow counts", async () => {
    const follow = new Follow({
      followerId: user1._id,
      followingId: user2._id,
    });
    await follow.save();

    const counts = await Follow.getFollowCounts(user2._id);
    expect(counts.followersCount).toBe(1);
    expect(counts.followingCount).toBe(0);
  });

  it("should create feed activity with createActivity", async () => {
    const activity = await FeedActivity.createActivity(
      user2._id,
      "book_published",
      book._id,
      { bookTitle: "Test Book" }
    );

    expect(activity.activityType).toBe("book_published");
    expect(activity.userId.toString()).toBe(user2._id.toString());
  });
});