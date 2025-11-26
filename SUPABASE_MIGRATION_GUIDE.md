# Supabase Migration Guide

This document outlines the migration from MongoDB/Mongoose to Supabase (Postgres) for the TrueTale backend.

## Overview

The migration replaces the MongoDB/Mongoose data layer with Supabase (Postgres) while maintaining all existing API contracts and frontend compatibility.

### Key Changes

1. **Database**: MongoDB → PostgreSQL (Supabase)
2. **Authentication**: JWT + Mongoose → Supabase Auth + JWT (hybrid approach)
3. **IDs**: MongoDB ObjectId → UUID
4. **Data Access**: Mongoose models → Repository pattern with Supabase client
5. **Validation**: ObjectId schemas → UUID schemas

## Migration Steps

### 1. Set Up Supabase Project

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Note your project URL and service role key from Settings > API
3. Run the schema DDL in the Supabase SQL Editor:
   ```bash
   # Copy the contents of apps/api/src/config/supabase-schema.sql
   # Paste into Supabase SQL Editor and execute
   ```

### 2. Update Environment Variables

Add the following to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep existing JWT secrets for API authentication
ACCESS_TOKEN_SECRET=your-existing-secret
REFRESH_TOKEN_SECRET=your-existing-secret
```

### 3. Install Dependencies

```bash
cd apps/api
npm install @supabase/supabase-js
```

### 4. Database Schema

The new Postgres schema includes:

#### Core Tables

- **users**: User profiles linked to Supabase Auth
  - Stores role (reader/writer), profile info, social links, payout settings
  - RLS policies for access control
  
- **books**: Book listings with full metadata
  - Support for drafts, pricing, tags, stats
  - JSONB metadata field for flexible data
  - Full-text search on title and description
  
- **book_files**: Separate table for book file attachments
  - PDF, EPUB, MOBI, sample files
  - Linked to books via foreign key
  
- **orders**: Purchase transactions
  - Stripe integration, download URLs, seller proceeds
  - Duplicate purchase prevention
  
- **reviews**: Book reviews and ratings
  - Auto-updates book rating stats via triggers
  
- **follows**: Writer/reader follow relationships
  
- **feed_activities**: Activity feed events
  
- **drafts**: Writer drafts
  
- **stories**: Published short stories
  
- **payouts**: Seller payout tracking

#### Key Features

- **UUID Primary Keys**: All tables use UUIDs instead of ObjectIds
- **JSONB Fields**: Flexible metadata storage for socials, payout settings, etc.
- **Triggers**: Auto-update timestamps, sync book status, update rating stats
- **Indexes**: Optimized for common queries (author lookups, searches, sorts)
- **RLS Policies**: Row-level security for data access control
- **Foreign Keys**: Referential integrity with cascade deletes

### 5. Architecture Changes

#### Before (MongoDB/Mongoose)

```typescript
import { User } from "@truetale/db";

// Direct Mongoose model usage
const user = await User.findById(userId);
await user.save();
```

#### After (Supabase + Repositories)

```typescript
import { UserRepository } from "../repositories/userRepository";

const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
await userRepo.update(userId, { bio: "New bio" });
```

### 6. Authentication Flow

The migration uses a **hybrid authentication approach**:

1. **User Registration**:
   - Create user in Supabase Auth (for password management)
   - Create profile row in `public.users` table
   - Email verification through Supabase

2. **User Login**:
   - Authenticate with Supabase Auth
   - Generate custom JWT tokens (for API compatibility)
   - Return tokens in same format as before

3. **Token Refresh**:
   - Use existing JWT refresh token mechanism
   - Maintains frontend compatibility

4. **Password Reset**:
   - Use Supabase's password reset flow
   - Email links handled by Supabase

This approach keeps the frontend API contracts identical while leveraging Supabase's auth infrastructure.

### 7. ID Conversion

**ObjectId → UUID Mapping**:

- Old: `507f1f77bcf86cd799439011` (24-char hex)
- New: `550e8400-e29b-41d4-a716-446655440000` (UUID v4)

**Validation Changes**:

```typescript
// Before
z.string().regex(/^[0-9a-fA-F]{24}$/)

// After
z.string().uuid()
// or for flexibility
z.string().min(1)
```

### 8. Repository Pattern

All data access is now through repository classes:

- `UserRepository`: User CRUD operations
- `BookRepository`: Book management, search, file handling
- `OrderRepository`: Order creation, queries, revenue calculations
- `ReviewRepository`: Review management
- `FollowRepository`: Follow/unfollow operations
- `FeedActivityRepository`: Activity feed operations
- `DraftRepository`: Draft management
- `StoryRepository`: Story publishing
- `PayoutRepository`: Payout tracking

Each repository encapsulates Supabase queries and provides clean interfaces.

### 9. Data Migration

To migrate existing data from MongoDB to Supabase:

1. **Export from MongoDB**:
   ```bash
   mongoexport --uri="mongodb://localhost:27017/truetale" --collection=users --out=users.json
   mongoexport --uri="mongodb://localhost:27017/truetale" --collection=books --out=books.json
   # Export all collections
   ```

2. **Transform Data**:
   - Convert ObjectIds to UUIDs
   - Flatten nested objects into JSONB fields
   - Convert date formats
   - Map field names (e.g., `_id` → `id`, `writerId` → `author_id`)

3. **Import to Supabase**:
   - Use Supabase's CSV import or SQL INSERT statements
   - Ensure foreign key references are maintained

**Note**: A data migration script is recommended but not included in this initial migration. Consider creating one if you have production data.

### 10. Testing Strategy

1. **Unit Tests**: Update to use Supabase test database
2. **Integration Tests**: Test all API endpoints with new data layer
3. **Migration Tests**: Verify data integrity after migration
4. **Performance Tests**: Compare query performance

### 11. Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Schema DDL executed in Supabase
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Code updated to use new controllers and repositories
- [ ] Data migration completed (if applicable)
- [ ] Tests passing
- [ ] API endpoints verified
- [ ] Frontend integration tested
- [ ] Monitoring and logging configured

### 12. Rollback Plan

If issues arise:

1. Keep MongoDB connection string in environment (commented out)
2. Maintain both old and new controller implementations temporarily
3. Use feature flags to switch between implementations
4. Keep database backups before migration

### 13. Performance Considerations

**PostgreSQL vs MongoDB**:

- ✅ Better ACID compliance and data integrity
- ✅ Powerful SQL queries and joins
- ✅ Built-in full-text search
- ✅ Mature ecosystem and tooling
- ⚠️ May require query optimization for complex aggregations
- ⚠️ Different indexing strategies

**Optimization Tips**:

- Use indexes on frequently queried columns
- Leverage JSONB for flexible metadata
- Use Postgres functions (RPC) for complex operations
- Enable connection pooling
- Monitor query performance with Supabase dashboard

### 14. API Contract Preservation

All existing API endpoints maintain their contracts:

- **Request Schemas**: Unchanged (Zod validation adjusted for UUIDs)
- **Response Shapes**: Identical structure
- **Status Codes**: Same HTTP status codes
- **Error Formats**: Consistent error messages
- **Authentication**: Same Bearer token mechanism

### 15. Known Differences

1. **Date Formats**: Postgres uses ISO 8601 strings (MongoDB also does, so minimal impact)
2. **ID Format**: UUIDs are longer than ObjectIds (frontend should handle strings generically)
3. **Query Performance**: Some aggregations may need optimization
4. **Transactions**: Postgres transactions are more robust than MongoDB

### 16. Next Steps

After initial migration:

1. **Optimize Queries**: Profile and optimize slow queries
2. **Add Caching**: Consider Redis for frequently accessed data
3. **Implement RLS**: Fine-tune Row Level Security policies
4. **Monitoring**: Set up Supabase monitoring and alerts
5. **Documentation**: Update API documentation with new examples
6. **Remove MongoDB Code**: Clean up deprecated Mongoose models

### 17. Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Postgres Docs**: https://www.postgresql.org/docs/
- **Migration Tools**: https://supabase.com/docs/guides/migrations

### 18. Breaking Changes (Minimal)

- **User IDs**: Now UUIDs instead of ObjectIds (ensure frontend treats as opaque strings)
- **Book IDs**: Now UUIDs
- **Date Fields**: Consistent ISO 8601 format
- **Verification Flow**: Uses Supabase-managed email verification

All changes are backward-compatible at the API level - the frontend should not require modifications.

## Code Migration Examples

### Example 1: User Lookup

**Before (MongoDB)**:
```typescript
import { User } from "@truetale/db";
const user = await User.findById(userId);
```

**After (Supabase)**:
```typescript
import { UserRepository } from "../repositories/userRepository";
const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
```

### Example 2: Book Search

**Before (MongoDB)**:
```typescript
const books = await Book.find({
  status: 'published',
  tags: { $in: ['fiction'] }
}).sort({ publishedAt: -1 }).limit(10);
```

**After (Supabase)**:
```typescript
const bookRepo = new BookRepository();
const { books } = await bookRepo.search({
  tags: ['fiction'],
  sortBy: 'newest',
  limit: 10
});
```

### Example 3: Order Creation

**Before (MongoDB)**:
```typescript
const order = new Order({
  userId: new ObjectId(userId),
  bookId: new ObjectId(bookId),
  amountCents: 1000
});
await order.save();
```

**After (Supabase)**:
```typescript
const orderRepo = new OrderRepository();
const order = await orderRepo.create({
  user_id: userId,
  book_id: bookId,
  amount_cents: 1000,
  writer_id: writerId,
  seller_proceeds_cents: 900
});
```

## Conclusion

This migration preserves all existing functionality while moving to a more robust, scalable database solution. The hybrid authentication approach ensures frontend compatibility while leveraging Supabase's auth infrastructure.

For questions or issues, refer to the Supabase documentation or contact the development team.
