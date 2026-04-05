# Finance Dashboard API

A production-grade REST API for a financial dashboard — built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript 5 |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Logging | Winston + Morgan |
| Rate Limiting | express-rate-limit |
| Testing | Jest + Supertest |

---

## Architecture

```
Controller → Service → Repository → Prisma → PostgreSQL
```

- **Controller** — HTTP only. Parses input, calls service, returns response.
- **Service** — Business logic. Validates rules, calls repository.
- **Repository** — Database access only. All Prisma queries live here.
- **Middleware** — authenticate → authorize → validate → handler → errorHandler

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 9+

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd finance-dashboard-api
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_dashboard"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_dashboard_test"
JWT_SECRET="your-minimum-256-bit-secret-change-this"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3001"
```

> **Security**: Generate a strong JWT secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Database setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Seed with sample data and test users
npm run prisma:seed
```

### 4. Run the server

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server starts at: `http://localhost:3000`

---

## Seeded Test Accounts

| Email | Password | Role |
|---|---|---|
| admin@company.com | Password123! | ADMIN |
| analyst@company.com | Password123! | ANALYST |
| viewer@company.com | Password123! | VIEWER |

---

## API Reference

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new account |
| POST | `/auth/login` | Public | Login, receive JWT |
| POST | `/auth/logout` | Auth | Logout (client drops token) |
| GET | `/auth/me` | Auth | Get own profile |

**Register**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Test User","password":"Password123!"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Password123!"}'
```

---

### Records Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/records` | VIEWER+ | List records (paginated, filterable) |
| GET | `/records/:id` | VIEWER+ | Get a single record |
| POST | `/records` | VIEWER+ | Create a record |
| PATCH | `/records/:id` | VIEWER+ | Update own record (ADMIN can update any) |
| DELETE | `/records/:id` | VIEWER+ | Soft-delete own record (ADMIN can delete any) |
| POST | `/records/:id/restore` | ADMIN | Restore a deleted record |

**Query params for GET /records:**
- `type` — `INCOME` or `EXPENSE`
- `categoryId` — UUID
- `startDate`, `endDate` — ISO date strings
- `search` — fuzzy match on notes
- `page`, `limit` — pagination (default: 1, 20)
- `sortBy` — `date | amount | createdAt` (default: `date`)
- `sortOrder` — `asc | desc` (default: `desc`)

---

### Dashboard Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | VIEWER+ | personal summary (VIEWER) / global (ANALYST+) |
| GET | `/dashboard/trends` | VIEWER+ | Monthly trends (VIEWER: personal / ANALYST+: global) |
| GET | `/dashboard/categories` | VIEWER+ | Category breakdown (?userId for ANALYST+) |
| GET | `/dashboard/recent` | VIEWER+ | Latest transactions (personal for VIEWER) |
| GET | `/dashboard/by-user` | ANALYST+ | Aggregated income/expense/balance per user |

**Summary query params:** `period` (weekly/monthly/yearly), `year`, `month`, `startDate`, `endDate`

---

### User Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | ANALYST+ | List all active users |
| GET | `/users/:id` | ANALYST+ | Get a specific user's profile |
| POST | `/users` | ADMIN | Create a new user |
| PATCH | `/users/:id` | ADMIN | Update user profile |
| PATCH | `/users/:id/role` | ADMIN | Change user role |
| PATCH | `/users/:id/status` | ADMIN | Change user status (ACTIVE/INACTIVE) |
| DELETE | `/users/:id` | ADMIN | Soft-delete a user |

---

### Response Contract

All responses follow a consistent shape:

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "amount", "message": "Amount must be positive" }]
  }
}
```

---

## Role-Based Access Control

| Action | VIEWER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|
| View own profile | ✓ | ✓ | ✓ |
| View records | ✓ (own) | ✓ (all) | ✓ (all) |
| Create records | ✓ | ✓ | ✓ |
| Update / Delete records | ✓ (own) | ✓ (own) | ✓ (all) |
| View recent activity | ✓ (own) | ✓ (all) | ✓ (all) |
| View dashboard summary | ✓ (own) | ✓ (all) | ✓ (all) |
| View trends & categories | ✓ (own) | ✓ (all*) | ✓ (all*) |
| View user list / details | — | ✓ | ✓ |
| Manage users (roles/status) | — | — | ✓ |
| Restore deleted records | — | — | ✓ |

\* *ANALYST and ADMIN can filter category-based analytics by specific users using `?userId=...`.*

---

## Testing

### Run all tests
```bash
npm test
```

### Unit tests only (no DB required)
```bash
npm run test:unit
```

### Integration tests (requires test DB)
```bash
# Set TEST_DATABASE_URL in .env first
npx prisma migrate deploy --schema=./prisma/schema.prisma
npm run test:integration
```

### Coverage report
```bash
npm run test:coverage
```

---

## Project Structure

```
finance-dashboard-api/
├── prisma/
│   ├── schema.prisma       # Single source of truth for DB schema
│   ├── migrations/         # Auto-generated migration history
│   └── seed.ts             # Seed data with all 3 roles
│
├── src/
│   ├── config/             # env, logger
│   ├── lib/                # Prisma singleton
│   ├── modules/            # Feature modules (auth, users, records, dashboard, categories)
│   │   └── <feature>/
│   │       ├── *.schema.ts    # Zod validation schemas + DTOs
│   │       ├── *.repository.ts # DB access only
│   │       ├── *.service.ts    # Business logic
│   │       ├── *.controller.ts # HTTP layer
│   │       └── *.routes.ts     # Route definitions + middleware wiring
│   ├── middleware/         # authenticate, authorize, validate, rateLimiter, errorHandler
│   ├── common/             # errors, response builder, types, constants
│   ├── app.ts              # Express app setup (no listen)
│   └── server.ts           # Entry point + graceful shutdown
│
└── tests/
    ├── unit/               # Service tests with mocked repositories
    ├── integration/        # Full HTTP cycle tests via Supertest
    └── helpers/            # Test DB utils, auth helpers
```

---

## Deployment

```bash
# 1. Set production environment variables
NODE_ENV=production
JWT_SECRET=<256-bit-random-secret>
DATABASE_URL=<production-postgres-url>
CORS_ORIGIN=<your-frontend-domain>

# 2. Install production dependencies
npm ci --only=production

# 3. Run migrations (NOT migrate dev)
npx prisma migrate deploy

# 4. Build and start
npm run build
npm start
```

**Notes:**
- Never use `prisma migrate dev` in CI/CD — use `prisma migrate deploy`
- Stack traces are suppressed in `NODE_ENV=production` responses
- Rate limiting for auth endpoints: 10 requests per 15 minutes per IP
- Set `CORS_ORIGIN` explicitly — never `*` in production
- Recommended platforms: Railway, Render, Fly.io (all have managed PostgreSQL)

---

## Health Check

```bash
curl http://localhost:3000/health
```
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development",
    "timestamp": "2025-03-15T10:30:00.000Z"
  }
}
```