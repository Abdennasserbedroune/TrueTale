#!/usr/bin/env tsx

/**
 * Data Migration Script: MongoDB → Supabase
 * 
 * This script exports data from MongoDB and prepares it for import to Supabase.
 * 
 * Usage:
 *   npm run migrate:prepare   # Export from MongoDB
 *   npm run migrate:import    # Import to Supabase
 * 
 * Note: This is a template. Adjust based on your actual data structure.
 */

import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { getSupabaseClient } from "../config/supabaseClient";

// MongoDB models (if still available)
// import { User, Book, Order, Review, Follow, FeedActivity, Draft, Story, Payout } from "@truetale/db";

interface ObjectIdMapping {
  [mongoId: string]: string; // Maps MongoDB ObjectId to UUID
}

const MIGRATION_DIR = path.join(process.cwd(), "migration-data");

/**
 * Step 1: Export data from MongoDB and generate UUID mappings
 */
async function exportFromMongoDB() {
  console.log("📦 Exporting data from MongoDB...\n");

  // Create migration directory
  if (!fs.existsSync(MIGRATION_DIR)) {
    fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  }

  // TODO: Uncomment and adjust when running actual migration
  /*
  // Export users and create UUID mapping
  const users = await User.find({}).lean();
  const userIdMap: ObjectIdMapping = {};
  
  const transformedUsers = users.map((user) => {
    const uuid = uuidv4();
    userIdMap[user._id.toString()] = uuid;
    
    return {
      id: uuid,
      email: user.email.toLowerCase(),
      username: user.username,
      role: user.role,
      name: user.name || null,
      profile: user.profile || null,
      bio: user.bio || null,
      avatar: user.avatar || null,
      location: user.location || null,
      socials: user.socials || {},
      is_verified: user.isVerified || false,
      stripe_account_id: user.stripeAccountId || null,
      stripe_onboarding_complete: user.stripeOnboardingComplete || false,
      payout_settings: user.payoutSettings || { frequency: "weekly", minimumThreshold: 5000 },
      notification_preferences: user.notificationPreferences || {
        emailUpdates: true,
        newFollowers: true,
        bookReviews: true,
        orderNotifications: true,
      },
      deletion_requested_at: user.deletionRequestedAt?.toISOString() || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  });

  // Save users and mapping
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "users.json"),
    JSON.stringify(transformedUsers, null, 2)
  );
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "user-id-mapping.json"),
    JSON.stringify(userIdMap, null, 2)
  );

  console.log(`✅ Exported ${transformedUsers.length} users`);

  // Export books
  const books = await Book.find({}).lean();
  const bookIdMap: ObjectIdMapping = {};
  
  const transformedBooks = books.map((book) => {
    const uuid = uuidv4();
    bookIdMap[book._id.toString()] = uuid;
    
    return {
      id: uuid,
      author_id: userIdMap[book.authorId?.toString()] || userIdMap[book.writerId?.toString()],
      title: book.title,
      slug: book.slug,
      description: book.description || "",
      cover_url: book.coverUrl || book.coverImage || null,
      price_cents: book.priceCents || book.price || 0,
      currency: book.currency || "USD",
      is_draft: book.isDraft !== undefined ? book.isDraft : book.status === "draft",
      status: book.status || "draft",
      visibility: book.visibility || "private",
      tags: book.tags || book.genres || [],
      category: book.category || null,
      language: book.language || "English",
      pages: book.pages || null,
      average_rating: book.averageRating || 0,
      review_count: book.reviewCount || 0,
      views: book.stats?.views || book.views || 0,
      sales: book.stats?.sales || book.sales || 0,
      published_at: book.publishedAt?.toISOString() || null,
      metadata: {},
      created_at: book.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: book.updatedAt?.toISOString() || new Date().toISOString(),
    };
  });

  fs.writeFileSync(
    path.join(MIGRATION_DIR, "books.json"),
    JSON.stringify(transformedBooks, null, 2)
  );
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "book-id-mapping.json"),
    JSON.stringify(bookIdMap, null, 2)
  );

  console.log(`✅ Exported ${transformedBooks.length} books`);

  // Export orders
  const orders = await Order.find({}).lean();
  const transformedOrders = orders.map((order) => ({
    id: uuidv4(),
    user_id: userIdMap[order.userId?.toString()],
    book_id: bookIdMap[order.bookId?.toString()],
    writer_id: userIdMap[order.writerId?.toString()],
    stripe_payment_intent_id: order.stripePaymentIntentId || null,
    amount_cents: order.amountCents || 0,
    currency: order.currency || "USD",
    platform_fee_cents: order.platformFeeCents || 0,
    seller_proceeds_cents: order.sellerProceedsCents || 0,
    status: order.status || "pending",
    download_url: order.downloadUrl || null,
    download_url_expires: order.downloadUrlExpires?.toISOString() || null,
    created_at: order.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: order.updatedAt?.toISOString() || new Date().toISOString(),
  }));

  fs.writeFileSync(
    path.join(MIGRATION_DIR, "orders.json"),
    JSON.stringify(transformedOrders, null, 2)
  );

  console.log(`✅ Exported ${transformedOrders.length} orders`);

  // Continue with other collections...
  // Reviews, Follows, FeedActivities, Drafts, Stories, Payouts

  */

  console.log("\n✅ Export complete! Data saved to:", MIGRATION_DIR);
  console.log("\n📝 Next steps:");
  console.log("1. Review exported JSON files");
  console.log("2. Run: npm run migrate:import");
}

/**
 * Step 2: Import transformed data to Supabase
 */
async function importToSupabase() {
  console.log("📥 Importing data to Supabase...\n");

  const supabase = getSupabaseClient();

  try {
    // Import users
    const usersData = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "users.json"), "utf-8")
    );

    console.log(`Importing ${usersData.length} users...`);
    
    // Note: Users need to be created in Supabase Auth first!
    // This requires using Supabase Admin API to create auth users
    
    // For profile data only:
    for (const user of usersData) {
      // First create auth user (admin API)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          role: user.role,
        },
      });

      if (authError) {
        console.error(`Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }

      // Then create profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user!.id,
        ...user,
        id: authData.user!.id, // Override with actual Supabase auth ID
      });

      if (profileError) {
        console.error(`Failed to create profile for ${user.email}:`, profileError.message);
      }
    }

    console.log("✅ Users imported");

    // Import books
    const booksData = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "books.json"), "utf-8")
    );

    console.log(`Importing ${booksData.length} books...`);
    
    const { error: booksError } = await supabase.from("books").insert(booksData);
    
    if (booksError) {
      console.error("Failed to import books:", booksError.message);
    } else {
      console.log("✅ Books imported");
    }

    // Import orders
    const ordersData = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "orders.json"), "utf-8")
    );

    console.log(`Importing ${ordersData.length} orders...`);
    
    const { error: ordersError } = await supabase.from("orders").insert(ordersData);
    
    if (ordersError) {
      console.error("Failed to import orders:", ordersError.message);
    } else {
      console.log("✅ Orders imported");
    }

    // Continue with other collections...

    console.log("\n✅ Import complete!");
    console.log("\n📝 Next steps:");
    console.log("1. Verify data in Supabase dashboard");
    console.log("2. Test API endpoints");
    console.log("3. Run integration tests");

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

/**
 * Verify migration integrity
 */
async function verifyMigration() {
  console.log("🔍 Verifying migration...\n");

  const supabase = getSupabaseClient();

  // Count records
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  console.log(`Users: ${userCount}`);

  const { count: bookCount } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true });
  console.log(`Books: ${bookCount}`);

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });
  console.log(`Orders: ${orderCount}`);

  // Verify foreign key integrity
  const { count: orphanedBooks } = await supabase
    .from("books")
    .select("*", { count: "exact", head: true })
    .is("author_id", null);
  console.log(`Orphaned books: ${orphanedBooks}`);

  const { count: orphanedOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .or("user_id.is.null,book_id.is.null");
  console.log(`Orphaned orders: ${orphanedOrders}`);

  console.log("\n✅ Verification complete!");
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case "export":
    exportFromMongoDB().catch(console.error);
    break;
  case "import":
    importToSupabase().catch(console.error);
    break;
  case "verify":
    verifyMigration().catch(console.error);
    break;
  default:
    console.log("Usage:");
    console.log("  npm run migrate export   - Export from MongoDB");
    console.log("  npm run migrate import   - Import to Supabase");
    console.log("  npm run migrate verify   - Verify migration");
    process.exit(1);
}
