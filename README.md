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

The backend test suite includes smoke tests for the `/health` endpoint and other critical API routes.

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
