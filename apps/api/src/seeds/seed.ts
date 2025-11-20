import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Book, Draft, Story, Review, Follow, FeedActivity } from "../models";

// Load environment variables
dotenv.config({ path: ".env" });

// Sample data adapted from the existing sampleData.ts
const mockUsers = [
  {
    email: "aria.sullivan@example.com",
    username: "aria_sullivan",
    password: "password123",
    role: "writer" as const,
    profile: "Speculative fiction author",
    bio: "Aria blends climate science with lyrical storytelling to explore resilient futures and the communities that build them.",
    avatar: "/avatars/aria.svg",
  },
  {
    email: "jules.fern@example.com",
    username: "jules_fern",
    password: "password123",
    role: "writer" as const,
    profile: "Mystery novelist",
    bio: "Jules writes slow-burn mysteries and interactive fiction, inviting readers to decode puzzles woven throughout sprawling urban legends.",
    avatar: "/avatars/jules.svg",
  },
  {
    email: "nova.kim@example.com",
    username: "nova_kim",
    password: "password123",
    role: "writer" as const,
    profile: "Poet laureate",
    bio: "Nova explores intimacy, technology, and diasporic identity through immersive poetry collections and multimedia chapbooks.",
    avatar: "/avatars/nova.svg",
  },
  {
    email: "ronin.gale@example.com",
    username: "ronin_gale",
    password: "password123",
    role: "writer" as const,
    profile: "Solarpunk journalist",
    bio: "Ronin reports on grassroots resilience projects around the world and experiments with collaborative worldbuilding labs.",
    avatar: "/avatars/ronin.svg",
  },
  {
    email: "reader.luna@example.com",
    username: "luna_reader",
    password: "password123",
    role: "reader" as const,
    profile: "Avid reader",
    bio: "Love discovering new authors and supporting independent writers.",
    avatar: "/avatars/luna.svg",
  },
  {
    email: "reader.max@example.com",
    username: "max_reader",
    password: "password123",
    role: "reader" as const,
    profile: "Book enthusiast",
    bio: "Always looking for the next great story to dive into.",
    avatar: "/avatars/max.svg",
  },
];

const mockBooks = [
  {
    title: "Tidal Dreams",
    description:
      "A serialized climate fiction saga following three generations of ocean engineers rebuilding floating cities.",
    category: "Science Fiction",
    price: 15.0,
    status: "published" as const,
    genres: ["Science Fiction", "Cli-Fi"],
    language: "English",
    pages: 342,
    averageRating: 4.5,
    reviewCount: 12,
    publishedAt: new Date("2024-09-12T08:00:00.000Z"),
  },
  {
    title: "Echo Vault",
    description:
      "An interactive noir mystery where readers unlock clues hidden across multiple timelines.",
    category: "Mystery",
    price: 18.0,
    status: "published" as const,
    genres: ["Mystery", "Interactive"],
    language: "English",
    pages: 425,
    averageRating: 4.8,
    reviewCount: 18,
    publishedAt: new Date("2024-10-01T20:00:00.000Z"),
  },
  {
    title: "Synaptic Gardens",
    description:
      "A multimedia poetry chapbook exploring digital rituals, intimacy, and ecological dreaming.",
    category: "Poetry",
    price: 11.0,
    status: "published" as const,
    genres: ["Poetry", "Speculative"],
    language: "English",
    pages: 128,
    averageRating: 4.2,
    reviewCount: 8,
    publishedAt: new Date("2024-08-05T09:00:00.000Z"),
  },
  {
    title: "Radical Horizon",
    description:
      "Investigative feature on solarpunk co-ops prototyping grid-independent infrastructure.",
    category: "Journalism",
    price: 9.5,
    status: "published" as const,
    genres: ["Journalism", "Solarpunk"],
    language: "English",
    pages: 256,
    averageRating: 4.0,
    reviewCount: 6,
    publishedAt: new Date("2024-09-01T12:00:00.000Z"),
  },
  {
    title: "Ember Letters",
    description: "An upcoming collection of speculative epistolary poems shared as weekly drafts.",
    category: "Poetry",
    price: 0,
    status: "draft" as const,
    genres: ["Poetry", "Speculative"],
    language: "English",
    pages: 96,
    averageRating: 0,
    reviewCount: 0,
  },
];

const mockDrafts = [
  {
    title: "Harbor Light Notes",
    content:
      "A collaborative worldbuilding draft documenting floating seed libraries across Pacific communities. Every lantern held a seed story, ready for the next port. The communities have developed intricate systems for sharing knowledge across vast distances...",
  },
  {
    title: "Clockwork City Sketches",
    content:
      "Urban exploration meets mechanical mystery. The city's underground systems run on a complex network of gears and pulleys, each with its own story to tell. I've been documenting the maintenance crews who keep everything running...",
  },
  {
    title: "Digital Rituals",
    content:
      "Exploring the intersection of technology and spirituality in modern worship. How do we create sacred spaces in virtual environments? What does it mean to commune through screens? These questions guide my research into digital ceremonies...",
  },
];

const mockStories = [
  {
    title: "The Last Librarian",
    content:
      "In a world where books have been digitized and forgotten, one librarian maintains the last physical library. Every day, she curates stories that refuse to be compressed into binary code, preserving the tactile experience of paper and ink...",
    published: true,
  },
  {
    title: "Neon Gardens",
    content:
      "Bioluminescent plants grow in the abandoned subway tunnels beneath the city. A group of urban explorers discovers this hidden ecosystem and must decide whether to protect it or expose it to a world that might destroy it...",
    published: true,
  },
  {
    title: "Memory Market",
    content:
      "In a near-future where memories can be bought and sold, a memory broker discovers a set of memories that shouldn't exist. These fragments suggest a different history than the one everyone remembers, and knowing the truth could cost everything...",
    published: false,
  },
];

const mockReviews = [
  {
    rating: 5,
    reviewText:
      "Absolutely brilliant! The worldbuilding is incredible and the characters feel so real.",
  },
  {
    rating: 4,
    reviewText:
      "Great story with a unique premise. The pacing could be improved in the middle section.",
  },
  { rating: 5, reviewText: "Couldn't put it down! The author's writing style is captivating." },
  {
    rating: 3,
    reviewText:
      "Good concept but the execution felt rushed. Would love to see a more developed version.",
  },
  { rating: 4, reviewText: "Thought-provoking and beautifully written. Definitely recommend." },
  { rating: 5, reviewText: "A masterpiece of the genre. This will stay with me for a long time." },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/content-platform";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Draft.deleteMany({}),
      Story.deleteMany({}),
      Review.deleteMany({}),
      Follow.deleteMany({}),
      FeedActivity.deleteMany({}),
    ]);
    console.log("Existing data cleared");

    // Create users
    console.log("Creating users...");
    const createdUsers = [];
    for (const userData of mockUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    const writers = createdUsers.filter((user) => user.role === "writer");
    const readers = createdUsers.filter((user) => user.role === "reader");

    // Create books
    console.log("Creating books...");
    const createdBooks = [];
    for (let i = 0; i < mockBooks.length; i++) {
      const bookData = {
        ...mockBooks[i],
        writerId: writers[i % writers.length]._id,
      };
      const book = new Book(bookData);
      await book.save();
      createdBooks.push(book);
    }
    console.log(`Created ${createdBooks.length} books`);

    // Create drafts
    console.log("Creating drafts...");
    const createdDrafts = [];
    for (let i = 0; i < mockDrafts.length; i++) {
      const draftData = {
        ...mockDrafts[i],
        writerId: writers[i % writers.length]._id,
      };
      const draft = new Draft(draftData);
      await draft.save();
      createdDrafts.push(draft);
    }
    console.log(`Created ${createdDrafts.length} drafts`);

    // Create stories
    console.log("Creating stories...");
    const createdStories = [];
    for (let i = 0; i < mockStories.length; i++) {
      const storyData = {
        ...mockStories[i],
        writerId: writers[i % writers.length]._id,
      };
      const story = new Story(storyData);
      await story.save();
      createdStories.push(story);
    }
    console.log(`Created ${createdStories.length} stories`);

    // Create reviews
    console.log("Creating reviews...");
    const createdReviews = [];
    for (let i = 0; i < mockReviews.length; i++) {
      const reviewData = {
        ...mockReviews[i],
        userId: readers[i % readers.length]._id,
        bookId: createdBooks[i % createdBooks.length]._id,
      };
      const review = new Review(reviewData);
      await review.save();
      createdReviews.push(review);
    }
    console.log(`Created ${createdReviews.length} reviews`);

    // Create follows
    console.log("Creating follows...");
    const createdFollows = [];
    for (let i = 0; i < readers.length; i++) {
      for (let j = 0; j < Math.min(3, writers.length); j++) {
        const followData = {
          followerId: readers[i]._id,
          followingId: writers[j]._id,
        };
        const follow = new Follow(followData);
        await follow.save();
        createdFollows.push(follow);
      }
    }
    console.log(`Created ${createdFollows.length} follows`);

    // Create feed activities
    console.log("Creating feed activities...");
    const createdActivities = [];

    // Book published activities
    for (const book of createdBooks.filter((b) => b.status === "published")) {
      const activity = new FeedActivity({
        userId: book.writerId,
        activityType: "book_published",
        targetId: book._id,
        metadata: { bookTitle: book.title },
      });
      await activity.save();
      createdActivities.push(activity);
    }

    // Review created activities
    for (const review of createdReviews) {
      const activity = new FeedActivity({
        userId: review.userId,
        activityType: "review_created",
        targetId: review.bookId,
        metadata: { rating: review.rating },
      });
      await activity.save();
      createdActivities.push(activity);
    }

    // Follow activities
    for (const follow of createdFollows.slice(0, 10)) {
      // Limit to avoid too many activities
      const activity = new FeedActivity({
        userId: follow.followerId,
        activityType: "follow_created",
        targetId: follow.followingId,
      });
      await activity.save();
      createdActivities.push(activity);
    }

    console.log(`Created ${createdActivities.length} feed activities`);

    console.log("\n=== Database seeding completed successfully! ===");
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Books: ${createdBooks.length}`);
    console.log(`Drafts: ${createdDrafts.length}`);
    console.log(`Stories: ${createdStories.length}`);
    console.log(`Reviews: ${createdReviews.length}`);
    console.log(`Follows: ${createdFollows.length}`);
    console.log(`Activities: ${createdActivities.length}`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
