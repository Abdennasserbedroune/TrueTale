# Inkwave Writers Marketplace

A Next.js application showcasing discovery surfaces and community tooling for independent writers. The experience includes public writer profiles, a searchable marketplace, collaborative engagement features, and an activity dashboard.

## Features

- **Public writer profiles** with SEO-friendly routing, highlighting bios, interests, publications, and public drafts.
- **Marketplace discovery tools** including full-text search, genre filters, interest chips, and curated carousels for recent, popular, and recommended works.
- **Community interactions** via likes, bookmarks, and comment threads on published works, plus simulated real-time direct messaging with preference-aware permissions.
- **Writer dashboard** summarising notifications, unread messages, activity feed, and personal publication stats.
- **Accessibility & responsiveness** ensured across navigation, forms, and interactive components.

## Getting Started

### Frontend Only

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the experience. The home page links to the profiles, marketplace, dashboard, and messaging hub.

### Full Stack (Frontend + Backend)

First, install dependencies:

```bash
npm install
```

Then, create a `.env.local` file in the project root with the following variables:

```
# Frontend configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Next, set up backend environment variables by creating a `.env` file in the `server/` directory. You can use `.env.example` as a template:

```bash
cp server/.env.example server/.env
```

The default `.env` file should work for local development with MongoDB running on `mongodb://localhost:27017/truetale`. For production or different MongoDB setups, update the `MONGO_URI` and other variables accordingly.

Finally, start both the frontend and backend concurrently:

```bash
npm run dev:full
```

This will start:

- **Frontend**: Next.js development server on [http://localhost:3000](http://localhost:3000)
- **Backend**: Express server on [http://localhost:5000](http://localhost:5000)

Alternatively, run them separately in different terminals:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

### Backend Environment Variables

The backend requires the following environment variables (see `server/.env.example` for defaults):

- `NODE_ENV` – Execution environment (default: `development`)
- `PORT` – Server port (default: `5000`)
- `MONGO_URI` – MongoDB connection string (default: `mongodb://localhost:27017/truetale`)
- `CLIENT_ORIGIN` – Allowed CORS origin (default: `http://localhost:3000`)
- `JWT_SECRET` – JWT signing secret (default: `dev-jwt-secret-key`)
- `JWT_REFRESH_SECRET` – JWT refresh token secret (default: `dev-jwt-refresh-secret-key`)

## Testing

### Frontend Tests

Vitest powers unit coverage for critical logic layers:

```bash
npm run test
```

The test suite validates marketplace search & filtering, messaging permissions, and engagement interactions (likes, bookmarks, comments).

### Backend Tests

Run backend tests with:

```bash
npm run server:test
```

The backend test suite includes smoke tests for the `/health` endpoint and comprehensive auth module tests.

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

## Project Structure

### Frontend

- `app/` – App Router pages for home, marketplace, writers, works, dashboard, and messages.
- `components/` – Reusable UI components such as work cards, writer cards, comment threads, and engagement panels.
- `data/` – Mock dataset representing writers, works, comments, messages, notifications, and marketplace events.
- `lib/` – Domain logic for discovery, engagement, messaging, and session helpers.
- `tests/` – Vitest suites covering discovery, messaging, and engagement rules.

### Backend

- `server/src/` – Express backend source code.
  - `config/` – Environment and database configuration.
  - `models/` – Mongoose schemas (User).
  - `controllers/` – Request handlers (auth).
  - `middleware/` – Auth middleware (requireAuth, requireRole).
  - `routes/` – Express route definitions.
  - `utils/` – Token service for JWT management.
  - `validation/` – Zod validation schemas.
  - `index.ts` – Server entry point with graceful shutdown handling.
  - `app.ts` – Express app with middleware setup (CORS, Helmet, rate limiting, error handling).
- `server/tests/` – Backend Vitest suites.

## Scripts

### Frontend

- `npm run dev` – Start the Next.js development server.
- `npm run build` – Build the production bundle.
- `npm run start` – Serve the production build.
- `npm run test` – Execute frontend Vitest unit tests.
- `npm run lint` – Run ESLint on the frontend.

### Backend

- `npm run server:dev` – Start the backend Express server in development mode with file watching.
- `npm run server:start` – Start the production backend server.
- `npm run server:build` – Build the TypeScript backend to JavaScript.
- `npm run server:test` – Execute backend Vitest unit tests.
- `npm run server:lint` – Run ESLint on the backend.

### Concurrent

- `npm run dev:full` – Start both frontend and backend development servers concurrently.

### Utility

- `npm run format` – Format all code with Prettier.
- `npm run format:check` – Check code formatting without making changes.

Feel free to extend the mocks or connect real data sources to evolve the platform further.
