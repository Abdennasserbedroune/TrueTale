# Inkwave Writers Marketplace

A Next.js application showcasing discovery surfaces and community tooling for independent writers. The experience includes public writer profiles, a searchable marketplace, collaborative engagement features, and an activity dashboard.

## 📁 Monorepo Structure

This project uses npm workspaces to manage a monorepo with shared packages. The structure is as follows:

```
truetale/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router pages
│   │   │   ├── components/    # React components
│   │   │   └── lib/           # Frontend utilities
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/        # API route handlers
│       │   ├── controllers/   # Business logic
│       │   ├── middleware/    # Express middleware
│       │   └── validation/    # Request validation
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── types/                  # Shared Zod schemas + TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts        # User schemas
│   │   │   ├── book.ts        # Book schemas
│   │   │   ├── order.ts       # Order schemas
│   │   │   └── index.ts       # Barrel exports
│   │   └── package.json
│   ├── db/                     # MongoDB models + connection
│   │   ├── src/
│   │   │   ├── models/        # Mongoose models
│   │   │   ├── connection.ts  # Database connection
│   │   │   └── index.ts
│   │   └── package.json
│   └── utils/                  # Common utilities
│       ├── src/
│       │   ├── pagination.ts  # Pagination helpers
│       │   ├── currency.ts    # Currency formatting
│       │   ├── date.ts        # Date utilities
│       │   └── index.ts
│       └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
└── package.json                # Root workspace config
```

### Shared Packages

- **@truetale/types**: Zod validation schemas and TypeScript types shared between frontend and backend
- **@truetale/db**: MongoDB models and database connection (used by backend)
- **@truetale/utils**: Common utilities like pagination, currency formatting, and date helpers

## Features

- **Public writer profiles** with SEO-friendly routing, highlighting bios, interests, publications, and public drafts.
- **Marketplace discovery tools** including full-text search, genre filters, interest chips, and curated carousels for recent, popular, and recommended works.
- **Community interactions** via likes, bookmarks, and comment threads on published works, plus simulated real-time direct messaging with preference-aware permissions.
- **Writer dashboard** summarising notifications, unread messages, activity feed, and personal publication stats.
- **Accessibility & responsiveness** ensured across navigation, forms, and interactive components.

## Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** (comes with Node.js)

### Installation

1. Clone the repository and install all workspace dependencies:

```bash
npm install
```

This will install dependencies for all workspaces (apps/web, apps/api, and all shared packages).

### Running the Application

#### Option 1: Run All Services (Recommended)

```bash
npm run dev:all
```

This starts both the frontend and backend concurrently.

#### Option 2: Run Services Separately

In separate terminal windows:

```bash
# Terminal 1 - Frontend (Next.js)
npm run dev:web

# Terminal 2 - Backend (Express API)
npm run dev:api
```

The services will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Environment Variables

#### Frontend (`apps/web/.env.local`)

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (`apps/api/.env`)

Create `apps/api/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/truetale
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=dev-jwt-secret-key
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-key
```

**⚠️ Never commit `.env` files to version control.** Use `.env.local` for local overrides and keep sensitive values secure.

## Testing

Run tests across all workspaces:

```bash
npm run test:all
```

Or run tests for specific workspaces:

```bash
# Frontend tests only
npm run test -w apps/web

# Backend tests only
npm run test -w apps/api
```

### Test Coverage

- **Frontend**: Vitest-powered unit tests for marketplace search, filtering, messaging permissions, and engagement interactions
- **Backend**: Integration tests for API endpoints including authentication, book management, orders, and feed activities

## Development Scripts

### Build & Type Checking

```bash
# Build all workspaces
npm run build:all

# Type check all workspaces
npm run typecheck:all

# Lint all workspaces
npm run lint:all
```

## Database Seeding

The platform includes a seeding workflow to populate your development database with sample data for testing and development.

### Running the Seed Script

To populate your database with sample users, books, drafts, stories, reviews, follows, and feed activities:

```bash
npm run seed -w apps/api
```

This will:
- Connect to your MongoDB database (using the `MONGO_URI` from your `.env` file)
- Clear all existing data from the collections
- Create sample users (writers and readers)
- Create sample books with different statuses
- Create drafts and stories for writers
- Generate reviews and follow relationships
- Create feed activities for community interactions

### Sample Data Overview

The seed script creates:
- **6 Users**: 4 writers and 2 readers with profiles
- **5 Books**: Mix of published and draft books across different genres
- **3 Drafts**: Work-in-progress content for writers
- **3 Stories**: Published and unpublished stories
- **6 Reviews**: Reader reviews for books
- **Follow Relationships**: Readers following writers
- **Feed Activities**: Activities tracking publications, reviews, and follows

### Resetting the Database

To completely reset your database and reseed from scratch:

```bash
# The seed script automatically clears existing data before seeding
npm run seed -w apps/api
```

**Note**: The seeding process will delete all existing data in the following collections: `users`, `books`, `drafts`, `stories`, `reviews`, `follows`, and `feedactivities`. Only run this on development databases.

## API Endpoints

### Authentication

All authentication endpoints are available under `/api/auth`:

#### Register a New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "role": "reader" // optional, defaults to "reader", can be "writer" or "reader"
}
```

**Response (201 Created):**

```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "username",
    "role": "reader",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

The refresh token is automatically set as an httpOnly cookie.

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "username",
    "role": "reader",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Logout

```bash
POST /api/auth/logout
```

**Response (200 OK):**

```json
{
  "message": "Logout successful"
}
```

Clears the refresh token cookie.

#### Refresh Access Token

```bash
POST /api/auth/refresh
```

The refresh token cookie must be present in the request.

**Response (200 OK):**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

A new refresh token cookie is automatically set.

### Protected Routes

To access protected routes, include the access token in the Authorization header:

```bash
GET /api/protected-route
Authorization: Bearer <access_token>
```

### Token Handling for Frontend

1. Store the access token in memory (not localStorage for security)
2. Include it in the Authorization header for all protected requests
3. The refresh token is handled automatically via httpOnly cookies
4. When the access token expires (15 minutes), call `/api/auth/refresh` to get a new one
5. On logout, call `/api/auth/logout` to clear the refresh token

**Example:**

```javascript
// Login
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important for cookies
  body: JSON.stringify({ email, password }),
});
const { accessToken, user } = await loginResponse.json();

// Protected request
const response = await fetch("http://localhost:5000/api/protected-route", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  credentials: "include",
});

// Refresh token
const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh", {
  method: "POST",
  credentials: "include", // Important for cookies
});
const { accessToken: newAccessToken } = await refreshResponse.json();
```

### Writer Content APIs

All `/api/writer` endpoints require an `Authorization: Bearer <access_token>` header and the authenticated user must have the `writer` role.

#### Books

- `GET /api/writer/books?page=<number>&limit=<number>` – Returns the writer's published books sorted by `publishedAt`/`createdAt` with pagination metadata.
- `POST /api/writer/books` – Creates a new book owned by the writer. `status` defaults to `"draft"`; sending `"published"` sets `publishedAt` automatically and records a `book_published` feed activity (stubbed for now).

  ```json
  {
    "title": "The Long Walk",
    "description": "A compelling narrative about perseverance.",
    "category": "Fiction",
    "price": 12.99,
    "genres": ["Drama", "Adventure"],
    "language": "English",
    "pages": 320,
    "status": "draft"
  }
  ```

- `PUT /api/writer/books/:id` – Updates book metadata, pricing, or status. Transitioning to `published` sets `publishedAt` and records a feed stub.
- `DELETE /api/writer/books/:id` – Permanently removes the book (hard delete).

#### Drafts

- `GET /api/writer/drafts?page=<number>&limit=<number>` – Lists all drafts owned by the writer.
- `POST /api/writer/drafts` – Creates a draft and auto-updates the `wordCount` summary.
- `PUT /api/writer/drafts/:id` – Updates draft title or content (word count recalculated).
- `DELETE /api/writer/drafts/:id` – Deletes the draft.

#### Stories

- `GET /api/writer/stories?page=<number>&limit=<number>` – Lists the writer's stories.
- `POST /api/writer/stories` – Creates a story. Stories publish immediately by default (`published: true`) and trigger a stubbed `story_published` feed activity.
- `DELETE /api/writer/stories/:id` – Deletes a story owned by the writer.

#### Profile

- `GET /api/writer/profile` – Returns the writer's profile plus aggregated counts for published books, drafts, and stories.
- `PUT /api/writer/profile` – Updates profile fields such as `bio`, `avatar`, `profile`, and social links.

  ```json
  {
    "bio": "Award-winning novelist.",
    "avatar": "https://example.com/avatar.png",
    "socials": {
      "website": "https://author.example.com",
      "twitter": "https://twitter.com/author"
    }
  }
  ```

Book writes and publications run inside MongoDB transactions to keep content and feed records in sync.

### Reader Engagement APIs

Readers can browse published books, manage their reviews, follow favourite writers, and maintain personal profile details.

#### Browse Published Books

- `GET /api/books?page=<number>&limit=<number>&search=<term>&category=<category>&genre=<genre>&minRating=<1-5>&maxRating=<1-5>&minPrice=<number>&maxPrice=<number>&sort=<recent|rating_desc|rating_asc|price_desc|price_asc>` – Public endpoint returning only published books. Each record includes the latest rating aggregates and a summary of the writer (username, profile, avatar, follower count).
- `GET /api/books/:id?page=<number>&limit=<number>` – Public endpoint returning a published book, writer snippet, and a paginated review payload. The response bundles review statistics (average rating, total count, and 1–5 star distribution).

#### Reviews

- `POST /api/books/:id/review` – Protected endpoint for creating or updating a review. Duplicate submissions update the existing review, writers cannot review their own books, and successful creates emit a stubbed `review_created` activity.
- `GET /api/reviews?page=<number>&limit=<number>` – Protected listing of the authenticated user’s reviews, including the associated book summary.
- `PUT /api/reviews/:id` – Protected endpoint for editing the reader’s own review.
- `DELETE /api/reviews/:id` – Protected endpoint for removing a review. Book aggregates are recalculated after deletion.

  ```json
  {
    "rating": 5,
    "reviewText": "Thoughtful worldbuilding and memorable characters."
  }
  ```

#### Follows

- `POST /api/follow/:writerId` – Protected endpoint to follow a writer. The operation is idempotent and updates follower counts while recording a `follow_created` feed stub.
- `DELETE /api/follow/:writerId` – Protected endpoint to unfollow a writer. Calling the endpoint multiple times is safe; a `follow_removed` feed stub is recorded when a relationship is removed.
- `GET /api/following` – Protected endpoint listing the writers the reader follows with basic profile summaries and follower counts.

#### Profile

- `GET /api/reader/profile` – Protected endpoint returning the authenticated user’s profile plus follower/following/review counts.
- `PUT /api/reader/profile` – Protected endpoint for updating reader profile fields (`profile`, `bio`, `avatar`, `socials`). Writers can also hit this endpoint for generic info, but writer-only fields (like their public profile tagline) are preserved.

Review creation automatically recomputes book rating statistics, and follow/unfollow flows ensure community metrics stay current while continuing to use the feed service stub.

### Activity Feeds

The platform tracks user activities and serves both personal and global activity feeds.

#### Feed Activity Types

Activities are recorded for the following actions:

- `book_published` – When a writer publishes a new book.
- `story_published` – When a writer publishes a new story.
- `review_created` – When a reader posts a review on a book.
- `follow_created` – When a reader follows a writer.
- `follow_removed` – When a reader unfollows a writer.

#### Get Personal Feed

```bash
GET /api/feed?page=<number>&limit=<number>
Authorization: Bearer <access_token>
```

Returns a paginated feed of activities from writers the authenticated user follows, sorted by most recent first.

**Response (200 OK):**

```json
{
  "activities": [
    {
      "id": "507f1f77bcf86cd799439011",
      "activityType": "book_published",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "username": "author_name",
        "avatar": "https://example.com/avatar.png"
      },
      "metadata": {
        "title": "The Long Walk"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Query Parameters:**

- `page` – Page number (default: 1, minimum: 1)
- `limit` – Items per page (default: 20, maximum: 100)

**Notes:**

- Requires authentication.
- Returns only activities from writers the user follows.
- Empty if the user follows no writers.

#### Get Global Feed

```bash
GET /api/feed/global?page=<number>&limit=<number>
```

Returns a paginated feed of all platform activities, sorted by most recent first. Available to both authenticated and anonymous users.

**Response (200 OK):**

```json
{
  "activities": [
    {
      "id": "507f1f77bcf86cd799439011",
      "activityType": "story_published",
      "createdAt": "2024-01-15T09:15:00.000Z",
      "user": {
        "id": "507f1f77bcf86cd799439012",
        "username": "another_author",
        "avatar": null
      },
      "metadata": {
        "title": "Midnight Musings"
      }
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

**Query Parameters:**

- `page` – Page number (default: 1, minimum: 1)
- `limit` – Items per page (default: 20, maximum: 100)

**Notes:**

- Public endpoint (no authentication required).
- Returns activities from all writers regardless of follow status.

### Checkout & Order APIs

The marketplace provides Stripe-ready checkout and order management endpoints for purchasing books.

#### Get Book Checkout Information

```bash
GET /api/books/:id/checkout
Authorization: Bearer <access_token>
```

Returns checkout information for a published book, including pricing and writer details.

**Response (200 OK):**

```json
{
  "book": {
    "id": "507f1f77bcf86cd799439011",
    "title": "The Great Adventure",
    "description": "An epic journey through unknown lands",
    "price": 12.99,
    "coverImage": "https://example.com/cover.jpg"
  },
  "writer": {
    "id": "507f1f77bcf86cd799439012",
    "username": "author_name",
    "profile": "Fantasy writer and world builder",
    "bio": "Writing epic adventures for over a decade",
    "avatar": "https://example.com/avatar.png"
  },
  "isPurchased": false
}
```

**Error Responses:**

- `404 Not Found` – Book does not exist
- `403 Forbidden` – Book is not published
- `401 Unauthorized` – Authentication required

**Notes:**

- Requires authentication.
- Only works for published books.
- `isPurchased` indicates if the user has already bought the book.

#### Create Order

```bash
POST /api/orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bookId": "507f1f77bcf86cd799439011"
}
```

Creates a new order or updates an existing pending order for the specified book.

**Response (201 Created):**

```json
{
  "id": "507f1f77bcf86cd799439013",
  "bookId": "507f1f77bcf86cd799439011",
  "writerId": "507f1f77bcf86cd799439012",
  "price": 12.99,
  "status": "pending",
  "clientSecret": "pi_507f1f77bcf86cd799439013_secret_1640995200000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` – Book does not exist
- `403 Forbidden` – Book is not published
- `409 Conflict` – User has already purchased this book
- `401 Unauthorized` – Authentication required
- `400 Bad Request` – Invalid book ID

**Notes:**

- Requires authentication.
- Prevents duplicate orders by updating existing pending orders.
- Returns a placeholder `clientSecret` for Stripe integration.
- Order status starts as `pending` and should be updated to `paid` via webhook.

#### Get User Orders

```bash
GET /api/user/orders?page=<number>&limit=<number>
Authorization: Bearer <access_token>
```

Returns a paginated list of all orders for the authenticated user.

**Response (200 OK):**

```json
{
  "orders": [
    {
      "id": "507f1f77bcf86cd799439013",
      "book": {
        "id": "507f1f77bcf86cd799439011",
        "title": "The Great Adventure",
        "coverImage": "https://example.com/cover.jpg"
      },
      "writer": {
        "id": "507f1f77bcf86cd799439012",
        "username": "author_name"
      },
      "price": 12.99,
      "status": "paid",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Query Parameters:**

- `page` – Page number (default: 1, minimum: 1)
- `limit` – Items per page (default: 10, maximum: 100)

**Notes:**

- Requires authentication.
- Returns orders in reverse chronological order (newest first).
- Includes all order statuses: `pending`, `paid`, `refunded`.

#### Get User Purchases

```bash
GET /api/user/purchases?page=<number>&limit=<number>
Authorization: Bearer <access_token>
```

Returns a paginated list of books the user has successfully purchased (paid orders).

**Response (200 OK):**

```json
{
  "purchases": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "The Great Adventure",
      "description": "An epic journey through unknown lands",
      "price": 12.99,
      "coverImage": "https://example.com/cover.jpg",
      "writer": {
        "id": "507f1f77bcf86cd799439012",
        "username": "author_name",
        "profile": "Fantasy writer and world builder",
        "bio": "Writing epic adventures for over a decade",
        "avatar": "https://example.com/avatar.png"
      },
      "purchasedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Query Parameters:**

- `page` – Page number (default: 1, minimum: 1)
- `limit` – Items per page (default: 10, maximum: 100)

**Notes:**

- Requires authentication.
- Only includes orders with `paid` status.
- Sorted by purchase date (most recent first).
- `purchasedAt` reflects when the order was marked as paid.

#### Stripe Webhook Handler

```bash
POST /api/webhooks/stripe
```

Accepts Stripe webhook events for payment processing. Currently logs payloads for development.

**Response (200 OK):**

```json
{
  "received": true
}
```

**Current Limitations:**

- Signature validation is stubbed (not implemented)
- Event handling is logged but not processed
- Order status updates must be done manually during development

**Required Environment Variables (Future):**

- `STRIPE_WEBHOOK_SECRET` – For webhook signature validation

**Development Notes:**

To mark orders as paid during development, update the order status directly in the database:

```javascript
// Example: Mark an order as paid
await Order.findByIdAndUpdate(orderId, { status: 'paid' });
```

## CI/CD Pipeline

This project includes a GitHub Actions CI/CD pipeline that runs on every push and pull request. The pipeline:

1. **Type Checks**: Validates TypeScript types across all workspaces
2. **Linting**: Runs ESLint on all code
3. **Tests**: Executes unit and integration tests with MongoDB test database
4. **Build**: Compiles all workspaces to ensure production builds succeed

The CI pipeline configuration is located at `.github/workflows/ci.yml`.

### Running CI Checks Locally

Before pushing code, you can run the same checks locally:

```bash
# Type check
npm run typecheck:all

# Lint
npm run lint:all

# Test
npm run test:all

# Build
npm run build:all
```

## Project Structure

The monorepo is organized into apps and shared packages:

### Apps

- **`apps/web/`** – Next.js frontend
  - `src/app/` – Next.js App Router pages
  - `src/components/` – Reusable React components
  - `src/lib/` – Frontend utilities and helpers
  - `tests/` – Frontend unit tests

- **`apps/api/`** – Express backend API
  - `src/routes/` – API route definitions
  - `src/controllers/` – Business logic and request handlers
  - `src/middleware/` – Auth and validation middleware
  - `src/validation/` – Request validation schemas
  - `src/config/` – Configuration management
  - `tests/` – Backend integration tests

### Packages

- **`packages/types/`** – Shared TypeScript types and Zod schemas used by both frontend and backend
- **`packages/db/`** – MongoDB models and database connection utilities
- **`packages/utils/`** – Common utilities (pagination, currency, dates)

## Available Scripts

### Root Scripts

- `npm run dev:all` – Start all workspaces in development mode
- `npm run dev:web` – Start only the frontend
- `npm run dev:api` – Start only the backend API
- `npm run build:all` – Build all workspaces
- `npm run test:all` – Run tests for all workspaces
- `npm run typecheck:all` – Type check all workspaces
- `npm run lint:all` – Lint all workspaces

### Workspace-Specific Scripts

You can run scripts for specific workspaces using the `-w` flag:

```bash
# Run tests for the web app only
npm run test -w apps/web

# Build the API only
npm run build -w apps/api

# Seed the database
npm run seed -w apps/api
```

Feel free to extend the functionality or connect additional data sources to evolve the platform further.
