## 🚀 Supabase Migration

The backend is in the process of migrating from MongoDB/Mongoose to Supabase (PostgreSQL). This migration provides:

- **Better data integrity** with ACID compliance
- **Robust authentication** via Supabase Auth
- **Row-level security** with PostgreSQL RLS policies
- **Advanced querying** with SQL and full-text search
- **Scalability** with managed PostgreSQL infrastructure

### Migration Status

✅ **Completed**:
- Database schema design (see `apps/api/src/config/supabase-schema.sql`)
- Supabase client setup
- Repository pattern for data access
- User authentication with Supabase Auth (hybrid approach)
- All core repositories (User, Book, Order, Review, Follow, etc.)

🚧 **In Progress**:
- Controller updates to use repositories
- Service layer refactoring
- Data migration from MongoDB

### Quick Start

If you're setting up Supabase for the first time, follow these steps:

1. **Read the guides**:
   - Quick setup: See `SUPABASE_QUICKSTART.md`
   - Detailed migration info: See `SUPABASE_MIGRATION_GUIDE.md`

2. **Create Supabase project**:
   ```bash
   # Visit https://supabase.com and create a new project
   # Get your project URL and service role key
   ```

3. **Configure environment**:
   ```bash
   cd apps/api
   cp .env.example .env
   # Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Run database schema**:
   - Copy contents of `apps/api/src/config/supabase-schema.sql`
   - Paste into Supabase SQL Editor and execute

5. **Install dependencies**:
   ```bash
   npm install  # From project root
   ```

6. **Start development**:
   ```bash
   npm run dev:all
   ```

### Architecture Changes

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

### Key Benefits

- **UUID IDs**: More secure and standardized than ObjectIds
- **Type Safety**: Full TypeScript support with Supabase types
- **JSONB Fields**: Flexible metadata storage
- **Triggers**: Auto-update ratings, timestamps, and status
- **Foreign Keys**: Referential integrity with cascade deletes
- **Connection Pooling**: Built-in with Supabase

### API Compatibility

All existing API endpoints maintain their contracts:
- Same request/response shapes
- Same HTTP status codes
- Same authentication mechanism (Bearer tokens)
- Minimal breaking changes

### For Developers

When working on new features:
1. Use repositories from `apps/api/src/repositories/`
2. Follow the repository pattern for new entities
3. Update tests to use Supabase test database
4. Avoid direct Mongoose model usage

For detailed information, see:
- `SUPABASE_QUICKSTART.md` - Quick setup guide
- `SUPABASE_MIGRATION_GUIDE.md` - Comprehensive migration docs
- `apps/api/src/config/supabase-schema.sql` - Database schema

---
