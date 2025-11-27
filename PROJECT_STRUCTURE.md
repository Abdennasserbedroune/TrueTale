# TrueTale Project Structure

## 📁 Clean Monorepo Organization

This is a clean, well-organized monorepo structure for the TrueTale platform.

```
TrueTale/
├── apps/                          # Applications
│   ├── web/                       # Frontend (Next.js)
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router pages
│   │   │   ├── components/       # React components
│   │   │   ├── lib/              # Frontend utilities & services
│   │   │   ├── contexts/         # React contexts
│   │   │   ├── types/            # Frontend TypeScript types
│   │   │   └── middleware.ts     # Next.js middleware
│   │   ├── public/               # Static assets
│   │   ├── tests/                # Frontend tests
│   │   └── package.json
│   │
│   └── api/                       # Backend (Express.js)
│       ├── src/
│       │   ├── controllers/      # Route controllers
│       │   ├── models/           # Database models
│       │   ├── routes/           # API routes
│       │   ├── middleware/       # Express middleware
│       │   ├── services/         # Business logic
│       │   ├── validation/       # Input validation schemas
│       │   ├── utils/            # Backend utilities
│       │   ├── config/           # Configuration
│       │   ├── seeds/            # Database seeds
│       │   ├── app.ts            # Express app setup
│       │   └── index.ts          # Server entry point
│       ├── tests/                # Backend tests
│       ├── .env                  # Environment variables
│       └── package.json
│
├── packages/                      # Shared packages
│   ├── types/                    # Shared TypeScript types
│   │   └── src/
│   │       ├── user.ts
│   │       ├── book.ts
│   │       ├── story.ts
│   │       ├── review.ts
│   │       ├── order.ts
│   │       └── index.ts
│   │
│   ├── db/                       # Database utilities
│   │   └── src/
│   │       └── index.ts
│   │
│   └── utils/                    # Shared utilities
│       └── src/
│           └── index.ts
│
├── .github/                      # GitHub workflows
├── node_modules/                 # Dependencies
├── package.json                  # Root package.json (workspace config)
├── tsconfig.json                 # Root TypeScript config
├── .eslintrc.json               # ESLint config
├── .prettierrc                  # Prettier config
├── .gitignore                   # Git ignore rules
├── DESIGN_SYSTEM.md             # Design system documentation
└── README.md                    # Project documentation
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Development

**Run Frontend Only:**
```bash
npm run dev:web
```

**Run Backend Only:**
```bash
npm run dev:api
```

**Run Both (Frontend + Backend):**
```bash
npm run dev:all
```

### Build

**Build All:**
```bash
npm run build:all
```

### Testing

**Run All Tests:**
```bash
npm run test:all
```

### Type Checking

**Check All TypeScript:**
```bash
npm run typecheck:all
```

### Linting

**Lint All Code:**
```bash
npm run lint:all
```

## 📦 Workspaces

This project uses npm workspaces for managing the monorepo:

- `apps/web` - Frontend application
- `apps/api` - Backend API
- `packages/types` - Shared TypeScript types
- `packages/db` - Database utilities
- `packages/utils` - Shared utilities

## 🔧 Technology Stack

### Frontend (`apps/web`)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Testing:** Vitest

### Backend (`apps/api`)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **Validation:** Zod
- **Testing:** Vitest

### Shared Packages
- **Types:** Shared TypeScript interfaces and types
- **DB:** Database connection and utilities
- **Utils:** Common utility functions

## 🌟 Key Features

- ✅ Clean separation of frontend and backend
- ✅ Shared type definitions across frontend and backend
- ✅ Monorepo structure with npm workspaces
- ✅ TypeScript throughout
- ✅ Consistent code style with ESLint and Prettier
- ✅ Comprehensive testing setup
- ✅ Environment-based configuration

## 📝 Notes

- All frontend code lives in `apps/web/src`
- All backend code lives in `apps/api/src`
- Shared types are in `packages/types/src`
- No duplicate files or folders at the root level
- Clean, organized, and maintainable structure
