# Supabase Migration Checklist

Track the progress of migrating from MongoDB to Supabase.

## Phase 1: Infrastructure Setup ✅

- [x] Create Supabase project
- [x] Design database schema (DDL)
- [x] Create tables in Supabase
- [x] Set up RLS policies
- [x] Configure indexes and constraints
- [x] Install @supabase/supabase-js dependency
- [x] Create Supabase client utility
- [x] Update environment variables

## Phase 2: Data Access Layer ✅

### Repositories Created
- [x] UserRepository
- [x] BookRepository
- [x] OrderRepository
- [x] ReviewRepository
- [x] FollowRepository
- [x] FeedActivityRepository
- [x] DraftRepository
- [x] StoryRepository
- [x] PayoutRepository

### Repository Features
- [x] CRUD operations
- [x] Search and filtering
- [x] Pagination support
- [x] Joins with related data
- [x] Aggregations (counts, sums)
- [x] Error handling

## Phase 3: Authentication 🚧

- [x] Create Supabase auth controller
- [x] Implement registration flow
- [x] Implement login flow
- [x] Implement email verification
- [x] Implement password reset
- [x] Implement token refresh
- [x] Maintain API contract compatibility
- [ ] Update authRoutes to use new controller by default
- [ ] Test all auth endpoints
- [ ] Update auth tests

## Phase 4: Controllers Migration 🚧

### Auth Controllers
- [x] authController.supabase.ts created
- [ ] Switch default to Supabase version
- [ ] Remove old MongoDB version

### Book Controllers
- [ ] Update bookController to use BookRepository
- [ ] Replace Mongoose queries with repository calls
- [ ] Test book CRUD operations
- [ ] Test file upload/management
- [ ] Test search and filtering

### Order Controllers
- [ ] Update orderController to use OrderRepository
- [ ] Replace Mongoose queries with repository calls
- [ ] Test order creation
- [ ] Test Stripe webhook handling
- [ ] Test download URL generation

### Reader Controllers
- [ ] Update readerController to use repositories
- [ ] Replace review operations
- [ ] Replace follow operations
- [ ] Test all reader endpoints

### Writer Controllers
- [ ] Update writerController to use repositories
- [ ] Replace draft operations
- [ ] Replace story operations
- [ ] Test all writer endpoints

### Profile Controllers
- [ ] Update profileController to use UserRepository
- [ ] Test profile updates
- [ ] Test username changes

## Phase 5: Services Migration 🚧

### Dashboard Service
- [ ] Update DashboardService to use repositories
- [ ] Replace MongoDB aggregations
- [ ] Reimplement getSellerStats
- [ ] Reimplement getRevenueHistory
- [ ] Reimplement getTopBooks
- [ ] Reimplement getRecentOrders
- [ ] Reimplement getPayoutHistory
- [ ] Test all dashboard endpoints

### Feed Service
- [ ] Update FeedService to use FeedActivityRepository
- [ ] Replace MongoDB queries
- [ ] Reimplement record()
- [ ] Reimplement getPersonalFeed()
- [ ] Reimplement getGlobalFeed()
- [ ] Reimplement getTrendingBooks()
- [ ] Test all feed endpoints

### Email Service
- [x] No changes needed (agnostic to database)

### Stripe Service (if exists)
- [ ] Verify compatibility with Supabase
- [ ] Update order lookups to use OrderRepository
- [ ] Test payment flows

## Phase 6: Middleware Updates 🚧

- [ ] Update authMiddleware to use UserRepository
- [ ] Replace User.findById with userRepo.findById
- [ ] Test protected routes
- [ ] Test optional auth routes

## Phase 7: Validation Schema Updates ✅

- [x] Review authValidation.ts (no changes needed)
- [x] Review writerValidation.ts (UUID-compatible)
- [x] Review readerValidation.ts (UUID-compatible)
- [x] Review orderValidation.ts (UUID-compatible)
- [ ] Update any ObjectId-specific validations if found
- [ ] Test validation edge cases

## Phase 8: Routes Updates 🚧

- [ ] Update authRoutes to use Supabase controller
- [ ] Verify bookRoutes work with new controller
- [ ] Verify orderRoutes work with new controller
- [ ] Verify feedRoutes work with new controller
- [ ] Verify dashboardRoutes work with new controller
- [ ] Verify writerRoutes work with new controller
- [ ] Verify readerRoutes work with new controller
- [ ] Verify profileRoutes work with new controller

## Phase 9: Testing 🚧

### Unit Tests
- [ ] Update user repository tests
- [ ] Update book repository tests
- [ ] Update order repository tests
- [ ] Update auth controller tests
- [ ] Update book controller tests
- [ ] Update order controller tests
- [ ] Update service tests

### Integration Tests
- [ ] Test auth flow end-to-end
- [ ] Test book CRUD end-to-end
- [ ] Test order creation and payment
- [ ] Test review system
- [ ] Test follow system
- [ ] Test feed generation
- [ ] Test dashboard stats

### Manual Testing
- [ ] Registration and verification
- [ ] Login and token refresh
- [ ] Book creation and publishing
- [ ] Order placement and payment
- [ ] Review posting
- [ ] Following writers
- [ ] Feed viewing
- [ ] Dashboard viewing

## Phase 10: Data Migration 📋

### Export from MongoDB
- [ ] Export users collection
- [ ] Export books collection
- [ ] Export orders collection
- [ ] Export reviews collection
- [ ] Export follows collection
- [ ] Export feed_activities collection
- [ ] Export drafts collection
- [ ] Export stories collection
- [ ] Export payouts collection

### Transform Data
- [ ] Convert ObjectIds to UUIDs
- [ ] Map field names (writerId → author_id, etc.)
- [ ] Transform nested objects to JSONB
- [ ] Convert date formats
- [ ] Validate foreign key relationships

### Import to Supabase
- [ ] Import users (with auth.users entries)
- [ ] Import books
- [ ] Import book_files
- [ ] Import orders
- [ ] Import reviews
- [ ] Import follows
- [ ] Import feed_activities
- [ ] Import drafts
- [ ] Import stories
- [ ] Import payouts

### Verification
- [ ] Verify record counts match
- [ ] Verify foreign key integrity
- [ ] Spot-check critical records
- [ ] Test queries on migrated data

## Phase 11: Frontend Updates 📋

- [ ] Review auth.ts (should work as-is)
- [ ] Test login flow
- [ ] Test registration flow
- [ ] Test token refresh
- [ ] Verify user IDs are treated as opaque strings
- [ ] Test all API calls with UUIDs
- [ ] Update any hardcoded ID formats
- [ ] Test error handling

## Phase 12: Performance Optimization 📋

- [ ] Profile slow queries in Supabase
- [ ] Add missing indexes
- [ ] Optimize aggregations
- [ ] Enable connection pooling
- [ ] Consider caching layer (Redis)
- [ ] Monitor query performance
- [ ] Optimize RLS policies if needed

## Phase 13: Documentation 📋

- [x] Create SUPABASE_MIGRATION_GUIDE.md
- [x] Create SUPABASE_QUICKSTART.md
- [x] Create migration checklist
- [ ] Update README.md with migration section
- [ ] Document API changes (if any)
- [ ] Update API documentation
- [ ] Create migration runbook
- [ ] Document rollback procedure

## Phase 14: Deployment Preparation 📋

- [ ] Test on staging environment
- [ ] Load test Supabase setup
- [ ] Verify RLS policies in production mode
- [ ] Set up monitoring and alerts
- [ ] Prepare rollback plan
- [ ] Schedule downtime window (if needed)
- [ ] Notify stakeholders

## Phase 15: Production Migration 📋

- [ ] Announce maintenance window
- [ ] Stop writes to MongoDB
- [ ] Run final data migration
- [ ] Switch to Supabase backend
- [ ] Verify critical flows work
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Re-enable full access

## Phase 16: Post-Migration 📋

- [ ] Monitor for 24-48 hours
- [ ] Fix any issues found
- [ ] Optimize slow queries
- [ ] Remove MongoDB dependencies
- [ ] Remove old Mongoose models
- [ ] Remove old controllers
- [ ] Clean up unused code
- [ ] Update CI/CD pipelines
- [ ] Celebrate! 🎉

## Phase 17: Cleanup 📋

- [ ] Remove @truetale/db package (MongoDB models)
- [ ] Remove mongoose dependency
- [ ] Remove mongodb-memory-server (dev dependency)
- [ ] Remove any MongoDB-specific utilities
- [ ] Archive old migration code
- [ ] Update package.json scripts
- [ ] Remove MongoDB from README

## Critical Paths

### Minimum Viable Migration (MVP)
Must complete to have working system:
1. Phase 1: Infrastructure Setup
2. Phase 2: Data Access Layer
3. Phase 3: Authentication
4. Phase 4: Controllers Migration (at least auth, book, order)
5. Phase 8: Routes Updates
6. Phase 9: Testing (basic manual testing)

### Full Production Migration
Required for production deployment:
1. All MVP phases
2. Phase 10: Data Migration
3. Phase 11: Frontend Updates
4. Phase 12: Performance Optimization
5. Phase 13: Documentation
6. Phase 14: Deployment Preparation
7. Phase 15: Production Migration
8. Phase 16: Post-Migration

## Current Status Summary

### ✅ Completed (Phases 1-2)
- Infrastructure setup
- Database schema
- All repositories created
- Supabase client configured
- Auth controller created (Supabase version)

### 🚧 In Progress (Phase 3-4)
- Authentication flow
- Controller migration
- Service updates

### 📋 Not Started (Phase 5+)
- Full controller migration
- Service refactoring
- Data migration
- Testing
- Deployment

## Estimated Effort

- **MVP**: ~2-3 days (for basic working system)
- **Full Migration**: ~1-2 weeks (including testing, data migration, deployment)
- **Cleanup**: ~1-2 days (post-migration)

## Risk Assessment

### High Risk
- Data migration with ObjectId → UUID conversion
- Breaking changes in API contracts
- Performance degradation from poorly optimized queries

### Medium Risk
- Authentication flow changes
- RLS policy configuration
- Frontend compatibility issues

### Low Risk
- Repository implementation (already done)
- Schema design (already done)
- Documentation

## Next Steps (Immediate)

1. **Switch auth to Supabase**: Update `authRoutes.ts` to use new controller
2. **Update one controller**: Start with `bookController` as proof of concept
3. **Test end-to-end**: Ensure auth + books work together
4. **Repeat for other controllers**: Follow the pattern
5. **Update services**: Refactor `DashboardService` and `FeedService`

## Notes

- Keep MongoDB connection available during transition for rollback
- Test thoroughly in development before production migration
- Consider gradual rollout with feature flags
- Monitor error rates and performance closely
- Have rollback plan ready at all times
