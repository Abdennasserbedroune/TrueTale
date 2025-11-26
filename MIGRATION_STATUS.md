# 🔄 Database Migration: MongoDB → Supabase (PostgreSQL)

## Current Status: Infrastructure Complete ✅ | Implementation In Progress 🚧

The TrueTale backend is migrating from MongoDB/Mongoose to Supabase (PostgreSQL) for improved scalability, data integrity, and security.

### Why Supabase?

- **PostgreSQL**: Industry-standard relational database with ACID compliance
- **Supabase Auth**: Built-in authentication with email verification, password reset
- **Row-Level Security (RLS)**: Database-level access control
- **Real-time**: Built-in real-time subscriptions (future feature)
- **Scalability**: Proven performance at scale
- **Developer Experience**: Excellent tooling and documentation

---

## 📊 Migration Progress

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 10 tables with indexes, triggers, RLS |
| Supabase Client | ✅ Complete | Configured with TypeScript types |
| Repositories | ✅ Complete | All 9 repositories implemented |
| Auth System | ✅ Complete | Hybrid Supabase Auth + JWT |
| Controllers | 🚧 In Progress | Needs updates to use repositories |
| Services | 🚧 In Progress | Dashboard & Feed services pending |
| Data Migration | 📋 Planned | Script template created |
| Testing | 📋 Planned | Integration tests pending |
| Documentation | ✅ Complete | Comprehensive guides available |

**Legend**: ✅ Complete | 🚧 In Progress | 📋 Not Started

---

## 🚀 Quick Start (New Setup)

For new developers or fresh installations using Supabase:

### 1. Create Supabase Project

```bash
# Go to https://supabase.com
# Create new project
# Copy URL and service role key
```

### 2. Run Database Schema

```bash
# Copy apps/api/src/config/supabase-schema.sql
# Paste into Supabase SQL Editor
# Execute to create all tables
```

### 3. Configure Environment

```bash
cd apps/api
cp .env.example .env

# Edit .env:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Install & Run

```bash
# From project root
npm install
npm run dev:all
```

📖 **Detailed instructions**: See [`SUPABASE_QUICKSTART.md`](./SUPABASE_QUICKSTART.md)

---

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [`SUPABASE_QUICKSTART.md`](./SUPABASE_QUICKSTART.md) | Setup instructions | All developers |
| [`SUPABASE_MIGRATION_GUIDE.md`](./SUPABASE_MIGRATION_GUIDE.md) | Comprehensive migration details | Tech leads, DevOps |
| [`SUPABASE_MIGRATION_CHECKLIST.md`](./SUPABASE_MIGRATION_CHECKLIST.md) | Track migration progress | Project managers |
| [`SUPABASE_MIGRATION_SUMMARY.md`](./SUPABASE_MIGRATION_SUMMARY.md) | High-level overview | Stakeholders |

---

## 🏗️ Architecture

### Before (MongoDB)

```
Client → Express → Controller → Mongoose Model → MongoDB
```

### After (Supabase)

```
Client → Express → Controller → Repository → Supabase Client → PostgreSQL
```

### Key Changes

- **IDs**: MongoDB ObjectId → PostgreSQL UUID
- **Auth**: Custom JWT + bcrypt → Supabase Auth + JWT (hybrid)
- **Data Access**: Mongoose models → Repository pattern
- **Relationships**: Virtual populate → SQL joins
- **Validation**: Zod schemas (unchanged)
- **API Contracts**: Preserved (no breaking changes)

---

## 🔐 Authentication

### Hybrid Approach

We use **Supabase Auth for user management** and **custom JWT tokens for API authentication**:

| Responsibility | Handler | Why |
|----------------|---------|-----|
| User registration | Supabase Auth | Secure password hashing |
| Email verification | Supabase Auth | Built-in email service |
| Password reset | Supabase Auth | Secure token management |
| API authentication | Custom JWT | Maintains frontend compatibility |
| Token refresh | Custom JWT | Existing flow preserved |

**Result**: Frontend code requires **zero changes** while leveraging Supabase infrastructure.

---

## 🗄️ Database Schema

### Tables Created

1. **users** - User profiles linked to Supabase Auth
2. **books** - Book listings with metadata
3. **book_files** - PDF, EPUB, MOBI files
4. **orders** - Purchase transactions
5. **reviews** - Book reviews and ratings
6. **follows** - Writer/reader relationships
7. **feed_activities** - Activity feed events
8. **drafts** - Writer drafts
9. **stories** - Published short stories
10. **payouts** - Seller payout tracking

### Features

- ✅ UUID primary keys
- ✅ Foreign key constraints
- ✅ JSONB for flexible metadata
- ✅ Indexes for performance
- ✅ Row-level security policies
- ✅ Triggers for auto-updates
- ✅ Full-text search indexes

**Schema**: See [`apps/api/src/config/supabase-schema.sql`](./apps/api/src/config/supabase-schema.sql)

---

## 💻 Repository Pattern

All data access uses repositories for clean separation:

```typescript
// User operations
import { UserRepository } from './repositories/userRepository';
const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
await userRepo.update(userId, { bio: 'New bio' });

// Book operations
import { BookRepository } from './repositories/bookRepository';
const bookRepo = new BookRepository();
const { books, total } = await bookRepo.search({
  query: 'fiction',
  tags: ['mystery'],
  sortBy: 'newest',
  limit: 10
});
```

### Available Repositories

- `UserRepository` - User CRUD, authentication
- `BookRepository` - Book management, search, files
- `OrderRepository` - Orders, revenue tracking
- `ReviewRepository` - Reviews with user joins
- `FollowRepository` - Follow/unfollow operations
- `FeedActivityRepository` - Activity feeds
- `DraftRepository` - Draft management
- `StoryRepository` - Story publishing
- `PayoutRepository` - Payout tracking

---

## 🔄 Migration for Existing Projects

If you have existing MongoDB data:

### Step 1: Export

```bash
# Run migration script
cd apps/api
npm run migrate export
```

### Step 2: Transform

The script converts:
- MongoDB ObjectIds → UUIDs
- Field names (e.g., `writerId` → `author_id`)
- Nested objects → JSONB
- References → Foreign keys

### Step 3: Import

```bash
npm run migrate import
npm run migrate verify
```

📖 **Details**: See [`SUPABASE_MIGRATION_GUIDE.md`](./SUPABASE_MIGRATION_GUIDE.md#data-migration)

---

## ✅ API Compatibility

### No Breaking Changes

- ✅ All endpoint URLs unchanged
- ✅ Request schemas unchanged
- ✅ Response shapes unchanged
- ✅ Authentication mechanism unchanged
- ✅ Frontend requires zero changes

### Minor Changes (Non-Breaking)

- User IDs are UUIDs (frontend treats as strings: ✅)
- Book IDs are UUIDs (frontend treats as strings: ✅)
- Dates are ISO 8601 (MongoDB used this too: ✅)

**Bottom line**: Frontend code continues to work without modification.

---

## 🧪 Testing

### Current Test Status

| Test Suite | MongoDB Version | Supabase Version |
|-------------|-----------------|------------------|
| Auth Tests | ✅ Passing | 🚧 Needs update |
| Book Tests | ✅ Passing | 🚧 Needs update |
| Order Tests | ✅ Passing | 🚧 Needs update |
| Integration Tests | ✅ Passing | 🚧 Needs update |

### Running Tests

```bash
# With MongoDB (current)
npm test

# With Supabase (after migration)
npm test  # Same command, different backend
```

---

## 🚀 Next Steps

### For New Features

When building new features:

1. ✅ Use repositories from `apps/api/src/repositories/`
2. ✅ Follow the repository pattern
3. ✅ Don't use Mongoose models directly
4. ✅ Use UUID for IDs, not ObjectId

### For Existing Features

Priority order for migration:

1. **Auth** ← Currently here
2. Books & Orders
3. Reviews & Follows
4. Feed & Dashboard
5. Remaining features

---

## 📞 Support

### Getting Help

- 📖 **Documentation**: Read guides in repository root
- 🐛 **Issues**: Check GitHub issues
- 💬 **Questions**: Ask in team Slack/Discord
- 🆘 **Supabase Support**: https://supabase.com/docs

### Common Issues

| Problem | Solution |
|---------|----------|
| "Missing Supabase configuration" | Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` |
| "Failed to create user" | Check service role key (not anon key) |
| Tests failing | Update tests to use Supabase or skip temporarily |
| "relation 'users' does not exist" | Run schema SQL in Supabase |

---

## 🎯 Success Metrics

Migration success criteria:

- [ ] All tests pass
- [ ] All endpoints functional
- [ ] Performance ≥ MongoDB
- [ ] Zero frontend changes needed
- [ ] No data loss
- [ ] User authentication works
- [ ] Payments work correctly
- [ ] No critical bugs for 48 hours

---

## 📅 Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Infrastructure | 1 day | ✅ Complete |
| Repository Layer | 2 days | ✅ Complete |
| Auth Migration | 1 day | ✅ Complete |
| Controller Updates | 2-3 days | 🚧 In Progress |
| Service Updates | 2-3 days | 📋 Planned |
| Data Migration | 1 day | 📋 Planned |
| Testing | 2-3 days | 📋 Planned |
| Deployment | 1 day | 📋 Planned |

**Total estimated time**: 1-2 weeks for full migration

---

## 🔒 Security

### Improvements

- ✅ Row-level security at database level
- ✅ Foreign key integrity enforcement
- ✅ Check constraints for data validation
- ✅ Supabase Auth best practices
- ✅ Service role key separation

### Best Practices

- 🔐 Never expose service role key to frontend
- 🔐 Use RLS policies for data access
- 🔐 Validate all input with Zod
- 🔐 Rate limit authentication endpoints
- 🔐 Use HTTPS in production

---

## 🎉 Benefits

After migration:

- ✅ **Better Data Integrity**: ACID transactions
- ✅ **Improved Security**: RLS policies
- ✅ **Better Performance**: Optimized queries
- ✅ **Real-time Support**: Built-in subscriptions
- ✅ **Better Tooling**: Supabase dashboard
- ✅ **Industry Standard**: PostgreSQL ecosystem
- ✅ **Easier Scaling**: Proven scalability

---

## 📋 Checklist for Developers

Before starting work:

- [ ] Read `SUPABASE_QUICKSTART.md`
- [ ] Set up Supabase project
- [ ] Configure `.env` with credentials
- [ ] Run schema DDL
- [ ] Install dependencies
- [ ] Test auth endpoints locally
- [ ] Familiarize with repositories

---

For complete information, see:
- **Quick Setup**: [`SUPABASE_QUICKSTART.md`](./SUPABASE_QUICKSTART.md)
- **Full Guide**: [`SUPABASE_MIGRATION_GUIDE.md`](./SUPABASE_MIGRATION_GUIDE.md)
- **Progress**: [`SUPABASE_MIGRATION_CHECKLIST.md`](./SUPABASE_MIGRATION_CHECKLIST.md)
- **Summary**: [`SUPABASE_MIGRATION_SUMMARY.md`](./SUPABASE_MIGRATION_SUMMARY.md)

---

**Questions?** Open an issue or ask in team chat.

**Ready to help?** Check [`SUPABASE_MIGRATION_CHECKLIST.md`](./SUPABASE_MIGRATION_CHECKLIST.md) for tasks.
