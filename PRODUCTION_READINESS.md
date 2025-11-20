# Production Readiness Checklist

This document outlines the security, monitoring, and deployment features implemented for TrueTale's production launch.

## ✅ Security Features

### Input Validation & Sanitization
- **Zod schemas**: All API endpoints validate request bodies and query parameters
- **XSS prevention**: Input sanitization middleware removes dangerous characters
- **MongoDB injection protection**: Mongoose schemas with strict validation
- **Location**: `apps/api/src/middleware/validation.ts`

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes (prevent brute force)
- **General API**: 30 requests per minute
- **Costly operations**: 10 requests per minute (uploads, searches)
- **Admin bypass**: Admins are exempt from rate limits
- **Location**: `apps/api/src/middleware/rateLimit.ts`

### Authentication & Authorization
- **JWT tokens**: Secure token-based authentication
- **Role-based access**: Users can have multiple roles (admin, writer, reader)
- **Ban system**: Admins can ban/unban users with reasons tracked
- **Location**: `apps/api/src/middleware/authMiddleware.ts`

### HTTPS & Security Headers
- **Helmet.js**: Security headers (HSTS, CSP, etc.)
- **CORS**: Configured to only allow frontend domain
- **Location**: `apps/api/src/app.ts`

## ✅ Monitoring & Observability

### Structured Logging
- **JSON logs**: All logs in structured JSON format
- **Log levels**: debug, info, warn, error
- **Context tracking**: Request ID, user ID, duration, etc.
- **Location**: `apps/api/src/lib/logger.ts`

### Error Handling
- **Global error handler**: Catches all unhandled errors
- **Error logging**: All errors logged with full context
- **Sentry ready**: Integration points for Sentry error tracking
- **Location**: `apps/api/src/middleware/errorHandler.ts`

### Health Checks
- **`/health`**: Comprehensive health check with DB status, memory, uptime
- **`/ready`**: Kubernetes-style readiness probe
- **`/alive`**: Kubernetes-style liveness probe
- **Location**: `apps/api/src/routes/healthRoutes.ts`

### Request Logging
- All requests logged with: method, path, status, duration, IP
- Performance tracking built-in
- **Location**: `apps/api/src/app.ts`

## ✅ Admin Features

### User Management
- **List users**: Search by email/username with pagination
- **Ban users**: Ban with reason (tracked in audit log)
- **Unban users**: Restore access
- **Endpoint**: `GET /api/v1/admin/users`
- **Endpoint**: `POST /api/v1/admin/users/:id/ban`
- **Endpoint**: `POST /api/v1/admin/users/:id/unban`

### Content Moderation
- **Remove books**: Delete books that violate policy
- **Remove reviews**: Delete inappropriate reviews
- **Endpoint**: `DELETE /api/v1/admin/books/:id`
- **Endpoint**: `DELETE /api/v1/admin/reviews/:id`

### Order Management
- **List orders**: View all orders with filters
- **Refund orders**: Process refunds via Stripe
- **Endpoint**: `GET /api/v1/admin/orders`
- **Endpoint**: `POST /api/v1/admin/orders/:id/refund`

### Platform Reports
- **Earnings report**: Total revenue, platform fees, seller payouts
- **Top sellers**: Best-performing authors by revenue
- **Endpoint**: `GET /api/v1/admin/earnings-report`
- **Endpoint**: `GET /api/v1/admin/top-sellers`

### Admin Panel UI
- **Location**: `apps/web/src/app/admin/page.tsx`
- **Features**: User management, order disputes, platform reports
- **Access**: Requires admin role

## ✅ Performance Optimization

### Database Indexes
All frequently queried fields have indexes:
- User: `email`, `username`, `roles`, `isBanned`
- Book: `authorId`, `slug`, `tags`, `isDraft`
- Order: `buyerId`, `writerId`, `status`
- Review: `bookId`, `userId`
- Follow: `followerId+followingId` (compound unique)
- FeedActivity: `userId+createdAt` (compound)

### Query Optimization
- Lean queries where possible (`.lean()`)
- Pagination on all list endpoints
- Field selection (`.select()`) to reduce payload size
- MongoDB aggregation pipelines for complex queries

### Response Compression
- Gzip compression enabled via `compression` middleware
- Reduces bandwidth and improves response times

## ✅ CI/CD Pipeline

### GitHub Actions Workflow
**Location**: `.github/workflows/ci.yml`

#### Security Job
- Security audit (`npm audit`)
- Runs on all PRs and pushes

#### Test Job
- Type checking (`npm run typecheck:all`)
- Linting (`npm run lint:all`)
- Unit tests (`npm run test:all`)
- Build verification (`npm run build:all`)
- Code coverage upload (Codecov)

#### Deploy Staging
- Auto-deploys `develop` branch to staging
- No manual approval required
- Environment: staging

#### Deploy Production
- Auto-deploys `main` branch to production
- **Requires manual approval** via GitHub environments
- Backup notification before deployment
- Environment: production

## 🔐 Environment Variables

### Required for Production

```bash
# API (.env.production)
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<strong-random-string>
CLIENT_ORIGIN=https://truetale.app

# AWS S3
AWS_S3_BUCKET=truetale-prod
AWS_ACCESS_KEY_ID=<from-aws>
AWS_SECRET_ACCESS_KEY=<from-aws>
AWS_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PLATFORM_FEE_PERCENT=10

# Optional: Error Tracking
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# Optional: Email
SENDGRID_API_KEY=SG....
```

```bash
# Web (.env.production)
NEXT_PUBLIC_API_URL=https://api.truetale.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 📊 Monitoring Setup

### Recommended Tools

1. **Error Tracking**: Sentry
   - Integration points in `errorHandler.ts`
   - Uncomment Sentry code when ready

2. **Logging**: CloudWatch / Datadog
   - Structured JSON logs ready for ingestion
   - All logs include context (user ID, request ID, etc.)

3. **Performance**: New Relic / Datadog APM
   - Request duration tracked
   - Database query performance

4. **Uptime**: UptimeRobot / Pingdom
   - Monitor `/health` endpoint
   - Alert on downtime

## 🚀 Deployment Checklist

### Before First Deploy
- [ ] Set all environment variables in hosting platform
- [ ] Configure SSL certificate (HTTPS)
- [ ] Set up MongoDB Atlas cluster (production tier)
- [ ] Create S3 bucket and configure CORS
- [ ] Configure Stripe production keys
- [ ] Set up Stripe webhook endpoint
- [ ] Configure CORS to allow frontend domain only
- [ ] Set up database backups (automated)
- [ ] Create admin user with admin role
- [ ] Test all critical flows in staging

### Before Every Deploy
- [ ] Run tests locally (`npm run test:all`)
- [ ] Check CI/CD pipeline passes
- [ ] Review code changes
- [ ] Backup database (if making schema changes)
- [ ] Announce maintenance window (if needed)

### After Deploy
- [ ] Check `/health` endpoint
- [ ] Verify database connection
- [ ] Test critical flows (signup, purchase, upload)
- [ ] Check error logs for issues
- [ ] Monitor performance metrics

## 🔧 Troubleshooting

### Health Check Failing
```bash
# Check database connection
curl https://api.truetale.app/health

# Check logs
tail -f /var/log/truetale/combined.log
```

### Rate Limit Issues
```bash
# Check rate limit headers in response
curl -I https://api.truetale.app/api/books

# Admins bypass rate limits
```

### Database Performance
```bash
# Check slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

## 📈 Scaling Recommendations

### When to Scale

1. **Add Redis** (1000+ active users)
   - Rate limiting store
   - Session storage
   - Caching layer (trending books, feed)

2. **Horizontal Scaling** (5000+ concurrent users)
   - Multiple API instances behind load balancer
   - Sticky sessions for WebSocket features

3. **Database Sharding** (1M+ users)
   - Shard by user ID
   - Read replicas for read-heavy operations

4. **CDN** (Day 1)
   - CloudFront for S3 assets (book covers, files)
   - Reduces latency globally

## 🛡️ Security Best Practices

### Ongoing
- [ ] Rotate JWT secrets monthly
- [ ] Review admin access quarterly
- [ ] Update dependencies weekly (`npm audit`)
- [ ] Review logs for suspicious activity
- [ ] Monitor failed login attempts
- [ ] Backup database daily
- [ ] Test disaster recovery quarterly

### Incident Response
1. Check error logs (`/var/log/truetale/error.log`)
2. Check health endpoint (`/health`)
3. Check Sentry for error spikes
4. Review recent deployments
5. Rollback if necessary (via CI/CD)
6. Post-mortem after resolution

## 📞 Support

For production issues:
- Check `/health` endpoint first
- Review logs in CloudWatch/Datadog
- Check Sentry for errors
- Contact DevOps team if DB/infrastructure issue

---

**Status**: Production Ready ✅
**Last Updated**: 2024
**Maintainer**: TrueTale Engineering Team
