# TrueTale Platform Foundation

TrueTale is the beginnings of a full-stack platform for authors who want to shape their creative practice online. The project ships an authenticated Next.js 14 (App Router) experience with Prisma models that map the core entities for the upcoming MVP: writers, their profiles, collaborative drafts, published works, community discussion, messaging, purchases, and file assets.

## What&apos;s included

- **Next.js 14 + TypeScript** with App Router, strict linting, and Prettier formatting.
- **Tailwind CSS UI shell** that provides a responsive layout, global navigation, and shared form components.
- **Credential-based authentication** powered by NextAuth and bcrypt hashing, including registration, login, and session management.
- **Profile onboarding and editing flows** with avatar upload to an S3-compatible object storage service (with a local filesystem fallback for development).
- **Prisma + PostgreSQL schema** defining the foundational data models: `User`, `Profile`, `Draft`, `Work`, `CommentThread`, `MessageThread`, `Message`, `MessageThreadParticipant`, `Purchase`, and `FileAsset`.
- **Protected routes and middleware** that redirect unauthenticated visitors away from the dashboard and profile management areas.
- **Vitest integration tests** covering registration, login, and profile CRUD APIs.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the database connection string (`DATABASE_URL`), NextAuth secret, and any S3 configuration values that apply to your environment. When object storage credentials are not provided, uploads fall back to `public/uploads`.

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Apply the schema**
   ```bash
   npx prisma db push
   ```
   For local development you can point `DATABASE_URL` at a Postgres instance (e.g. Docker, Supabase, Neon).

5. **Run the app**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) and create an account. After registration you&apos;ll be directed through the profile onboarding flow.

## Authentication overview

- `/api/auth/[...nextauth]` exposes the NextAuth handlers. Credentials-based sign in uses Prisma to verify email/password pairs.
- `/api/auth/register` performs user creation, hashing the password with bcrypt and provisioning a linked profile record.
- Protected routes are enforced via middleware and server redirects. The `SessionProvider` keeps client components in sync.

## Object storage

Avatar uploads stream through `/api/profile/avatar`. When S3 credentials are set, the runtime writes to the configured bucket. Without credentials the upload is stored to `public/uploads` so local development and automated tests run without cloud dependencies.

## Testing

Run the focused Vitest integration suite with:

```bash
npm run test
```

The tests mock Prisma to validate registration, login, and profile API behaviour, ensuring auth flows and profile CRUD remain regression-free.

## Project structure

- `app/` – App Router routes, including auth pages, profile flows, dashboard, and API handlers.
- `components/` – Shared layout, form UI, and auth/profile client components.
- `lib/` – Prisma client, password utilities, validation schemas, and storage helpers.
- `prisma/` – Prisma schema and future migrations.
- `tests/` – Vitest integration specs.

Feel free to extend these foundations with real-time collaboration, publishing workflows, commerce, and analytics as the platform grows.
