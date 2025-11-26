# Supabase Migration - Quick Start Guide

This guide will help you quickly set up and test the Supabase migration for the TrueTale backend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier is fine)
- Access to the TrueTale codebase

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: `truetale-dev` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
4. Click "Create new project" and wait ~2 minutes for provisioning

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (under "Project API keys" - **NOT the anon key**)

## Step 3: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open `/apps/api/src/config/supabase-schema.sql` from the project
4. Copy the entire contents and paste into the SQL Editor
5. Click "Run" or press `Ctrl+Enter`
6. Verify success - you should see "Success. No rows returned"
7. Go to **Database > Tables** to verify all tables were created:
   - users
   - books
   - book_files
   - orders
   - reviews
   - follows
   - feed_activities
   - drafts
   - stories
   - payouts

## Step 4: Configure Environment Variables

1. Navigate to `/apps/api` directory
2. Create or update `.env` file:

```bash
# Copy from .env.example
cp .env.example .env
```

3. Edit `.env` and add your Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep existing secrets or generate new ones
ACCESS_TOKEN_SECRET=your-secret-here
REFRESH_TOKEN_SECRET=your-other-secret-here

# Other config (set as needed)
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Important**: Keep your service role key secret! Never commit it to version control.

## Step 5: Install Dependencies

```bash
# From project root
cd apps/api
npm install

# This will install @supabase/supabase-js and other dependencies
```

## Step 6: Update App to Use Supabase Auth

To enable Supabase authentication, you need to switch the auth controller. Open `/apps/api/src/routes/authRoutes.ts` and update:

**Before:**
```typescript
import { createAuthController } from "../controllers/authController";
```

**After:**
```typescript
import { createSupabaseAuthController as createAuthController } from "../controllers/authController.supabase";
```

This change uses the new Supabase-backed auth while maintaining the same API contract.

## Step 7: Test the Setup

### Option A: Run Tests

```bash
cd apps/api
npm test
```

Note: Some tests may need updates to work with Supabase. See "Known Issues" below.

### Option B: Manual Testing with cURL

Start the development server:

```bash
cd apps/api
npm run dev
```

Test user registration:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "role": "reader"
  }'
```

Expected response:
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid-here"
}
```

Verify the user in Supabase:
1. Go to **Authentication > Users** in Supabase dashboard
2. You should see the new user listed

## Step 8: Verify in Supabase Dashboard

1. **Check Users Table**:
   - Go to **Database > Tables > users**
   - You should see your test user with UUID, email, username, etc.

2. **Check Authentication**:
   - Go to **Authentication > Users**
   - The user should appear here too (Supabase Auth tracks auth state)

3. **Test Policies**:
   - The RLS policies are enabled
   - Users can only see/edit their own data (verified by service role key bypass)

## Common Issues

### Issue 1: "Missing Supabase configuration"

**Solution**: Ensure `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.

### Issue 2: "Failed to create user account"

**Solutions**:
- Check that Supabase project is active (not paused)
- Verify service role key is correct (not anon key)
- Check Supabase project logs in dashboard

### Issue 3: Tests failing with MongoDB errors

**Solution**: Tests still reference MongoDB models. To fix:
1. Update tests to use Supabase test database
2. Or temporarily skip tests until migration is complete

### Issue 4: "relation 'users' does not exist"

**Solution**: Run the schema SQL again in Supabase SQL Editor.

## Next Steps

After successful setup:

1. **Migrate Controllers**: Update other controllers to use repositories
   - `bookController` → use `BookRepository`
   - `orderController` → use `OrderRepository`
   - etc.

2. **Update Services**: 
   - `dashboardService` → use repositories instead of Mongoose aggregations
   - `feedService` → use `FeedActivityRepository`

3. **Test All Endpoints**: Verify each API endpoint works with Supabase

4. **Migrate Data** (if you have production data):
   - Export from MongoDB
   - Transform ObjectIds to UUIDs
   - Import to Supabase

## Verification Checklist

- [ ] Supabase project created and active
- [ ] Schema SQL executed successfully
- [ ] All 10+ tables visible in Supabase dashboard
- [ ] Environment variables configured
- [ ] Dependencies installed (`@supabase/supabase-js` present)
- [ ] Auth controller switched to Supabase version
- [ ] Server starts without errors
- [ ] Registration creates user in Supabase Auth
- [ ] User profile created in `users` table
- [ ] JWT tokens work for API authentication

## Architecture Overview

The new architecture uses:

1. **Supabase Auth**: User authentication and password management
2. **Postgres Database**: All data storage (users, books, orders, etc.)
3. **Repository Pattern**: Clean data access layer
4. **JWT Tokens**: API authentication (generated by our backend)
5. **RLS Policies**: Row-level security in Postgres

This maintains all existing API contracts while using Supabase infrastructure.

## Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Issues**: Check GitHub issues for this repo

## Development vs Production

**Development**:
- Use Supabase hosted database
- Service role key for backend operations
- Local development server

**Production**:
- Same Supabase setup (or separate project)
- Secure service role key in environment variables
- Enable RLS and security policies
- Use connection pooling if high traffic

## Security Notes

1. **Never expose service role key** to frontend
2. **Use RLS policies** to secure data access
3. **Validate all input** on backend (Zod schemas)
4. **Rate limit** authentication endpoints
5. **Use HTTPS** in production
6. **Rotate secrets** regularly

## Performance Tips

1. **Use indexes** for frequently queried fields (already in schema)
2. **Enable Postgres extensions** as needed (e.g., pg_trgm for fuzzy search)
3. **Monitor query performance** in Supabase dashboard
4. **Use connection pooling** (Supabase provides this)
5. **Cache frequently accessed data** (consider Redis)

## Rollback Plan

If you need to rollback to MongoDB:

1. Keep MongoDB connection string in `.env` (commented)
2. Switch back to old controller:
   ```typescript
   import { createAuthController } from "../controllers/authController";
   ```
3. Comment out Supabase repository imports
4. Restart server

Both systems can coexist temporarily for gradual migration.

---

That's it! You should now have a working Supabase-backed TrueTale backend. 🎉

For detailed migration information, see `SUPABASE_MIGRATION_GUIDE.md`.
