# Inkwave Writers Marketplace

A Next.js application showcasing discovery surfaces and community tooling for independent writers. The experience includes public writer profiles, a searchable marketplace, collaborative engagement features, and an activity dashboard.

## Features

- **Public writer profiles** with SEO-friendly routing, highlighting bios, interests, publications, and public drafts.
- **Marketplace discovery tools** including full-text search, genre filters, interest chips, and curated carousels for recent, popular, and recommended works.
- **Community interactions** via likes, bookmarks, and comment threads on published works, plus simulated real-time direct messaging with preference-aware permissions.
- **Draft collaboration workspace** for composing rich-text drafts with autosave, sharing controls, revision history, inline comments, and live collaboration signals.
- **Writer dashboard** summarising notifications, unread messages, activity feed, and personal publication stats.
- **Accessibility & responsiveness** ensured across navigation, forms, and interactive components.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the experience. The home page links to the profiles, marketplace, dashboard, and messaging hub.

## Testing

Vitest powers unit coverage for critical logic layers:

```bash
npm run test
```

The test suite validates marketplace search & filtering, messaging permissions, and engagement interactions (likes, bookmarks, comments).

## Project Structure

- `app/` – App Router pages for home, marketplace, writers, works, dashboard, and messages.
- `components/` – Reusable UI components such as work cards, writer cards, comment threads, and engagement panels.
- `data/` – Mock dataset representing writers, works, comments, messages, notifications, and marketplace events.
- `lib/` – Domain logic for discovery, engagement, messaging, and session helpers.
- `tests/` – Vitest suites covering discovery, messaging, and engagement rules.

## Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Build the production bundle.
- `npm run start` – Serve the production build.
- `npm run test` – Execute Vitest unit tests.

Feel free to extend the mocks or connect real data sources to evolve the platform further.
