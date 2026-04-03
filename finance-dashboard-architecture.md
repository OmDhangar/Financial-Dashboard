# Finance Dashboard — Backend Architecture Blueprint

---

## 1. Brief Architecture Overview

A layered, role-driven REST API built on Node.js + Express, backed by PostgreSQL via Prisma ORM. The system follows a classic **Controller → Service → Repository** separation, enforces RBAC through dedicated middleware, and centralizes all error and logging behavior into a consistent response contract.

The design is deliberately pragmatic: no microservices, no event sourcing, no unnecessary complexity — just a clean, well-organized monolith that is easy to navigate, test, and extend.

---

## 2. Recommended Stack with Justification

### Core
| Concern | Choice | Justification |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, wide ecosystem, async I/O ideal for dashboard APIs |
| Framework | Express.js | Minimal, well-understood, easy to layer middleware |
| Language | TypeScript | Type safety across controllers/services/DTOs, eliminates entire classes of bugs |
| ORM | Prisma | Type-safe queries, first-class migrations, excellent DX |
| Database | **PostgreSQL** | See detailed justification below |
| Validation | Zod | Schema-first validation, parses and types at runtime simultaneously |
| Auth | JWT (jsonwebtoken) + bcrypt | Stateless, scales well, no session storage needed |
| Logging | Winston | Structured JSON logs, multiple transports, log levels |
| HTTP Logging | Morgan | Request/response log middleware, integrates with Winston |
| Rate Limiting | express-rate-limit | Protects analytics and auth endpoints |
| Testing | Jest + Supertest | Unit tests for services, integration tests for routes |
| API Docs | Swagger (swagger-ui-express + zod-to-openapi) | Auto-generates OpenAPI spec from Zod schemas |
| Config | dotenv + env-var | Typed environment variable access, fails fast on missing vars |

---

### Why PostgreSQL Over MongoDB or MySQL

This is the most consequential decision in the architecture. Here is the analytical breakdown:

**ACID Compliance is Non-Negotiable for Financial Data**
Financial records involve monetary amounts, category totals, and net balances. A partial write — for instance, a record inserted without a proper category FK — corrupts dashboard aggregates. PostgreSQL's ACID guarantees, row-level locking, and foreign key constraints prevent this at the database level, not at the application level.

**Relational Model Fits the Domain Perfectly**
The domain has clear, stable relationships: a User has one Role, a Record belongs to a User and a Category. These are not dynamic or document-like. Forcing this into MongoDB's document model would mean either duplicating role data in every user document or doing application-level joins — both are regressions.

**Aggregation Queries Are SQL's Native Strength**
The dashboard requires `SUM`, `GROUP BY`, date truncation (`DATE_TRUNC`), window functions for trend analysis, and filtered aggregates. These are first-class SQL operations. Writing equivalent pipelines in MongoDB's aggregation framework is verbose, harder to read, and harder to optimize. A single PostgreSQL query can compute total income, total expenses, net balance, and category-wise breakdown in one pass.

**PostgreSQL vs MySQL**
PostgreSQL is preferred over MySQL for: better support for JSON columns (useful for metadata), more powerful window functions, `GENERATED ALWAYS AS` computed columns, better CTE support, and a stronger open-source ecosystem. For a finance dashboard with trend analysis, these matter.

**Prisma as the ORM**
Prisma provides a strongly-typed query builder, auto-generated TypeScript types from the schema, and a first-class migration system. It eliminates raw SQL for routine queries while still allowing `$queryRaw` for complex dashboard analytics when needed.

---

## 3. Folder Structure

```
finance-dashboard-api/
├── prisma/
│   ├── schema.prisma           # Database schema (single source of truth)
│   ├── migrations/             # Auto-generated migration files
│   └── seed.ts                 # Seed data for dev/testing
│
├── src/
│   ├── config/
│   │   ├── env.ts              # Typed env variable access via env-var
│   │   ├── logger.ts           # Winston logger instance
│   │   └── swagger.ts          # Swagger/OpenAPI setup
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts      # Zod schemas for login/register
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.schema.ts
│   │   │
│   │   ├── records/
│   │   │   ├── record.controller.ts
│   │   │   ├── record.service.ts
│   │   │   ├── record.repository.ts
│   │   │   ├── record.routes.ts
│   │   │   └── record.schema.ts
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.controller.ts
│   │       ├── dashboard.service.ts
│   │       ├── dashboard.routes.ts
│   │       └── dashboard.schema.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification → attaches req.user
│   │   ├── authorize.ts        # Role guard factory: authorize('ADMIN', 'ANALYST')
│   │   ├── validate.ts         # Zod request validation middleware
│   │   ├── rateLimiter.ts      # express-rate-limit configs
│   │   └── errorHandler.ts     # Global error handler middleware
│   │
│   ├── common/
│   │   ├── errors/
│   │   │   ├── AppError.ts         # Base custom error class
│   │   │   ├── NotFoundError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   └── ValidationError.ts
│   │   ├── response/
│   │   │   └── apiResponse.ts      # Consistent response shape builder
│   │   ├── types/
│   │   │   └── express.d.ts        # Augments Express Request with req.user
│   │   └── constants/
│   │       └── roles.ts            # Role enum / permission map
│   │
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   │
│   ├── app.ts                  # Express app setup (no listen)
│   └── server.ts               # Server entry point (listen + shutdown)
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   └── integration/
│       ├── auth.test.ts
│       ├── records.test.ts
│       └── dashboard.test.ts
│
├── .env
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  VIEWER
  ANALYST
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum RecordType {
  INCOME
  EXPENSE
}

model User {
  id          String     @id @default(uuid())
  email       String     @unique
  name        String
  passwordHash String    @map("password_hash")
  role        Role       @default(VIEWER)
  status      UserStatus @default(ACTIVE)
  records     Record[]
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  deletedAt   DateTime?  @map("deleted_at")   // soft delete

  @@map("users")
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  records   Record[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("categories")
}

model Record {
  id          String     @id @default(uuid())
  amount      Decimal    @db.Decimal(15, 2)   // Decimal, not Float — avoids floating point errors in money
  type        RecordType
  category    Category   @relation(fields: [categoryId], references: [id])
  categoryId  String     @map("category_id")
  date        DateTime
  notes       String?
  createdBy   User       @relation(fields: [createdById], references: [id])
  createdById String     @map("created_by_id")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  deletedAt   DateTime?  @map("deleted_at")   // soft delete

  @@index([type])
  @@index([categoryId])
  @@index([date])
  @@index([createdById])
  @@map("records")
}
```

**Key schema decisions:**
- `Decimal(15, 2)` for monetary amounts — never use `Float` for money. PostgreSQL's `NUMERIC` type is exact.
- Soft delete via `deletedAt` on both `User` and `Record`. Deleted records remain queryable for audit purposes.
- All foreign keys are indexed explicitly.
- `Category` is a first-class entity, not a bare string, enabling category-wise aggregation without string grouping.
- `createdBy` on `Record` enables per-user audit trails.

---

## 5. API Endpoint Design

### Auth
```
POST   /api/v1/auth/register          Public
POST   /api/v1/auth/login             Public
POST   /api/v1/auth/logout            Authenticated
GET    /api/v1/auth/me                Authenticated
```

### Users (Admin only)
```
GET    /api/v1/users                  ADMIN
GET    /api/v1/users/:id              ADMIN
POST   /api/v1/users                  ADMIN
PATCH  /api/v1/users/:id              ADMIN
PATCH  /api/v1/users/:id/role         ADMIN
PATCH  /api/v1/users/:id/status       ADMIN
DELETE /api/v1/users/:id              ADMIN (soft delete)
```

### Financial Records
```
GET    /api/v1/records                VIEWER | ANALYST | ADMIN
GET    /api/v1/records/:id            VIEWER | ANALYST | ADMIN
POST   /api/v1/records                ADMIN
PATCH  /api/v1/records/:id            ADMIN
DELETE /api/v1/records/:id            ADMIN (soft delete)
```

Query params for `GET /records`:
- `type` — INCOME | EXPENSE
- `categoryId` — filter by category
- `startDate`, `endDate` — date range
- `search` — fuzzy match on notes
- `page`, `limit` — pagination (default: page=1, limit=20)
- `sortBy`, `sortOrder` — sorting (default: date desc)

### Dashboard
```
GET    /api/v1/dashboard/summary      ANALYST | ADMIN
GET    /api/v1/dashboard/trends       ANALYST | ADMIN
GET    /api/v1/dashboard/categories   ANALYST | ADMIN
GET    /api/v1/dashboard/recent       VIEWER | ANALYST | ADMIN
```

Query params:
- `period` — weekly | monthly | yearly (default: monthly)
- `year`, `month` — specific period filter

### Categories
```
GET    /api/v1/categories             All authenticated
POST   /api/v1/categories             ADMIN
DELETE /api/v1/categories/:id         ADMIN
```

---

## 6. Role-Based Access Control Matrix

| Endpoint / Action | VIEWER | ANALYST | ADMIN |
| View own profile  |   ✓    |   ✓     |   ✓   |
| View financial records |   ✓    |   ✓     |   ✓   |
| View recent activity |   ✓    |   ✓     |   ✓   |
| View dashboard summary |   —    |   ✓     |   ✓   |
| View trends & category breakdown |   —    |   ✓     |   ✓   |
| Create financial records |   —    |   —     |   ✓   |
| Update financial records |   —    |   —     |   ✓   |
| Delete financial records |   —    |   —     |   ✓   |
| Manage users (CRUD) |   —    |   —     |   ✓   |
| Assign roles |   —    |   —     |   ✓   |
| Toggle user status |   —    |   —     |   ✓   |
| Manage categories |   —    |   —     |   ✓   |

**Implementation:** The `authorize` middleware is a factory function that accepts a list of permitted roles and short-circuits the request with `403 Forbidden` if the authenticated user's role is not in the list.

```typescript
// src/middleware/authorize.ts
import { Role } from '@prisma/client';
import { RequestHandler } from 'express';
import { ForbiddenError } from '../common/errors/ForbiddenError';

export const authorize = (...roles: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};

// Usage in route:
router.post('/records', authenticate, authorize('ADMIN'), validate(createRecordSchema), recordController.create);
```

---

## 7. Validation Strategy

All input validation is done with **Zod** at the route level via a `validate` middleware. Zod schemas are defined alongside their route files and serve as the single source of truth for both runtime validation and TypeScript types.

```typescript
// src/modules/records/record.schema.ts
import { z } from 'zod';

export const createRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['INCOME', 'EXPENSE']),
    categoryId: z.string().uuid('Invalid category ID'),
    date: z.coerce.date(),
    notes: z.string().max(500).optional(),
  }),
});

export const getRecordsQuerySchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    categoryId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// The validate middleware
export const validate = (schema: AnyZodObject): RequestHandler => {
  return async (req, _res, next) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return next(new ValidationError(result.error.flatten()));
    }
    // Overwrite req with parsed (coerced, sanitized) values
    Object.assign(req, result.data);
    next();
  };
};
```

**Rules:**
- All monetary amounts validated as positive numbers
- Date fields use `z.coerce.date()` so ISO strings from HTTP are safely parsed
- UUIDs validated with `.uuid()` before hitting the database
- Pagination limits capped at 100 to prevent DB abuse
- String fields have max length constraints

---

## 8. Error Handling Strategy

### Consistent Response Contract

Every response — success or error — follows the same shape:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 }  // optional, for paginated responses
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "amount", "message": "Amount must be positive" }
    ]
  }
}
```

### Custom Error Hierarchy

```
AppError (base)
├── ValidationError    → 400  BAD_REQUEST
├── UnauthorizedError  → 401  UNAUTHORIZED
├── ForbiddenError     → 403  FORBIDDEN
├── NotFoundError      → 404  NOT_FOUND
├── ConflictError      → 409  CONFLICT
└── InternalError      → 500  INTERNAL_SERVER_ERROR
```

Each error class sets its own `statusCode` and `code` string. The global error handler catches all thrown errors and formats them into the consistent contract above.

### Global Error Handler

```typescript
// src/middleware/errorHandler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Log all errors through Winston
  logger.error({
    message: err.message,
    code: err.code ?? 'INTERNAL_SERVER_ERROR',
    path: req.path,
    method: req.method,
    userId: req.user?.id ?? null,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      apiResponse.error(err.code, err.message, err.details)
    );
  }

  // Prisma-specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json(
        apiResponse.error('CONFLICT', 'A record with this value already exists')
      );
    }
    if (err.code === 'P2025') {
      return res.status(404).json(
        apiResponse.error('NOT_FOUND', 'Record not found')
      );
    }
  }

  // Fallback: never expose internal details in production
  return res.status(500).json(
    apiResponse.error('INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
  );
};
```

**Key principles:**
- Prisma error codes (`P2002`, `P2025`) are caught and translated to user-friendly messages
- Stack traces logged but never sent to the client in production
- All errors flow through Winston — searchable, structured, timestamped
- `req.user.id` attached to every error log for traceability

---

## 9. Service / Repository / Controller Separation

**Controller** — HTTP concerns only. Parse validated input, call service, return response. Never touches Prisma directly.

**Service** — Business logic. Validates business rules (e.g. cannot delete a category that has records), calls repository, may call other services. Never touches `req` or `res`.

**Repository** — Database access only. All Prisma queries live here. Returns domain objects. Nothing else.

```typescript
// Controller → calls service
async create(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await this.recordService.createRecord(req.user.id, req.body);
    res.status(201).json(apiResponse.success(record));
  } catch (error) {
    next(error);
  }
}

// Service → applies business rules, calls repository
async createRecord(userId: string, dto: CreateRecordDto): Promise<Record> {
  const category = await this.categoryRepository.findById(dto.categoryId);
  if (!category) throw new NotFoundError('Category not found');
  return this.recordRepository.create({ ...dto, createdById: userId });
}

// Repository → pure database
async create(data: CreateRecordData): Promise<Record> {
  return prisma.record.create({ data });
}
```

---

## 10. Dashboard Analytics Implementation

The dashboard service uses Prisma's `groupBy` and raw SQL for efficient aggregation. All queries exclude soft-deleted records (`deletedAt: null`).

```typescript
// dashboard.service.ts

async getSummary(filters: DashboardFilters) {
  const where = {
    deletedAt: null,
    date: { gte: filters.startDate, lte: filters.endDate },
  };

  const [incomeResult, expenseResult] = await Promise.all([
    prisma.record.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.record.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome  = incomeResult._sum.amount  ?? 0;
  const totalExpense = expenseResult._sum.amount ?? 0;

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionCount: incomeResult._count + expenseResult._count,
  };
}

async getCategoryBreakdown(filters: DashboardFilters) {
  return prisma.record.groupBy({
    by: ['categoryId', 'type'],
    where: { deletedAt: null, date: { gte: filters.startDate, lte: filters.endDate } },
    _sum: { amount: true },
    _count: true,
  });
}

async getMonthlyTrends(year: number) {
  // Raw SQL for DATE_TRUNC — more expressive than Prisma's groupBy for time-series
  return prisma.$queryRaw<TrendRow[]>`
    SELECT
      DATE_TRUNC('month', date) AS month,
      type,
      SUM(amount)               AS total,
      COUNT(*)                  AS count
    FROM records
    WHERE
      EXTRACT(YEAR FROM date) = ${year}
      AND deleted_at IS NULL
    GROUP BY month, type
    ORDER BY month ASC
  `;
}
```

---

## 11. Request Middleware Flow

```
Incoming Request
     │
     ▼
Morgan (HTTP log)
     │
     ▼
express.json() + helmet() + cors()
     │
     ▼
Rate Limiter (per-endpoint configs)
     │
     ▼
authenticate() — verifies JWT, attaches req.user
     │
     ▼
authorize(...roles) — checks req.user.role
     │
     ▼
validate(schema) — Zod schema parse, coerces types
     │
     ▼
Controller Handler
     │
     ▼ (on error)
Global errorHandler — formats + logs, sends consistent response
```

---

## 12. Naming Conventions

- **Files:** `kebab-case.type.ts` — e.g., `record.service.ts`, `auth.controller.ts`
- **Classes:** PascalCase — `RecordService`, `AuthController`
- **Variables/functions:** camelCase — `createRecord`, `userId`
- **DB tables:** snake_case (enforced via `@@map` in Prisma)
- **API routes:** kebab-case, plural nouns — `/financial-records`, `/api/v1/users`
- **Env vars:** SCREAMING_SNAKE_CASE — `DATABASE_URL`, `JWT_SECRET`
- **Error codes:** SCREAMING_SNAKE_CASE strings — `'NOT_FOUND'`, `'VALIDATION_ERROR'`
- **Zod schemas:** suffixed with `Schema` — `createRecordSchema`, `loginSchema`
- **DTOs:** suffixed with `Dto` — `CreateRecordDto`, `UpdateUserDto`

---

## 13. Sample Request/Response Payloads

### POST /api/v1/auth/login
```json
// Request
{ "email": "admin@company.com", "password": "securePassword123" }

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid", "name": "Admin User", "email": "admin@company.com", "role": "ADMIN" }
  }
}

// Response 401
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password" }
}
```

### GET /api/v1/records?type=INCOME&page=1&limit=10
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": "15000.00",
      "type": "INCOME",
      "category": { "id": "uuid", "name": "Salary" },
      "date": "2025-03-01T00:00:00.000Z",
      "notes": "Monthly salary",
      "createdBy": { "id": "uuid", "name": "Admin User" },
      "createdAt": "2025-03-01T09:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### GET /api/v1/dashboard/summary
```json
// Response 200
{
  "success": true,
  "data": {
    "totalIncome": "45000.00",
    "totalExpense": "31500.00",
    "netBalance": "13500.00",
    "transactionCount": 67
  }
}
```

---

## 14. Development Roadmap (Implementation Order)

### Phase 1 — Foundation
1. Initialize repo: `npm init`, TypeScript config, ESLint + Prettier
2. Set up `src/app.ts` and `src/server.ts` skeleton
3. Configure environment variables (`env.ts`)
4. Set up Winston logger (`logger.ts`)
5. Initialize Prisma, write schema, run first migration
6. Write Prisma client singleton (`lib/prisma.ts`)
7. Build `apiResponse` helper and `AppError` hierarchy
8. Wire up global `errorHandler` middleware

### Phase 2 — Auth Module
9. Implement `auth.service.ts` (register, login, JWT sign/verify)
10. Implement `authenticate` middleware
11. Implement `auth.controller.ts` and `auth.routes.ts`
12. Write Zod schemas for auth endpoints
13. Test with Postman / curl

### Phase 3 — User Module
14. Implement `user.repository.ts` (CRUD + soft delete)
15. Implement `user.service.ts`
16. Implement `authorize` middleware
17. Wire `user.controller.ts` + `user.routes.ts` with RBAC guards

### Phase 4 — Categories + Records
18. Implement `category` repository + service + routes
19. Implement `record.repository.ts` with filtering, pagination, soft delete
20. Implement `record.service.ts`
21. Write `record.schema.ts` (create, update, query Zod schemas)
22. Implement `record.controller.ts` + `record.routes.ts`

### Phase 5 — Dashboard
23. Implement `dashboard.service.ts` (summary, trends, category breakdown, recent)
24. Implement `dashboard.controller.ts` + `dashboard.routes.ts`

### Phase 6 — Cross-Cutting Concerns
25. Add `express-rate-limit` for auth + dashboard endpoints
26. Add `helmet` + `cors` to `app.ts`
27. Integrate Morgan with Winston transport
28. Write seed data (`prisma/seed.ts`) with all three roles

### Phase 7 — Testing
29. Unit tests for service layer (mock repositories)
30. Integration tests for auth, records, dashboard endpoints (Supertest + test DB)
31. Test soft delete behavior
32. Test RBAC — verify 403s for wrong roles

### Phase 8 — Documentation + Polish
33. Set up `zod-to-openapi` and `swagger-ui-express`
34. Add JSDoc to service layer
35. Write `README.md` with setup, env vars, seeding, and test instructions
36. Add `.env.example`

---

## 15. Testing Strategy

### Unit Tests (Jest)
- Service layer functions with mocked repositories
- Test business rule enforcement (e.g., cannot create record with invalid category)
- Test role checks in service layer where applicable
- Test date/amount edge cases

### Integration Tests (Jest + Supertest)
- Full HTTP request cycle against a test database (separate `TEST_DATABASE_URL`)
- Auth flow: register → login → receive JWT → use JWT
- RBAC: test each role against each protected endpoint, verify 403 for unauthorized
- Records: create, paginate, filter, soft-delete, verify deleted record not returned in list
- Dashboard: verify summary totals match seeded records

### Test Conventions
- Each test file seeds its own data (no shared state between test files)
- Use `beforeEach` to reset relevant tables
- Test the HTTP contract (status codes, response shape) — not Prisma internals

---

## 16. Documentation Strategy

- **Swagger UI** at `/api/docs` in non-production environments
- OpenAPI spec auto-generated from Zod schemas via `zod-to-openapi`
- `README.md` covers: prerequisites, installation, env setup, seeding, running tests, deployment
- Inline JSDoc on all service method signatures (parameters, return type, thrown errors)
- `CHANGELOG.md` for version tracking if the project extends beyond the assessment

---

## 17. Tradeoffs and Assumptions

| Decision | Tradeoff |
|---|---|
| JWT stateless auth (no refresh tokens) | Simpler implementation; tokens cannot be revoked before expiry. Acceptable for an assessment; production would add refresh token rotation. |
| Monolith, not microservices | Appropriate for this scope. Adding services later is easier when domain boundaries are clear from a well-structured monolith. |
| Soft delete (not hard delete) | Increases query complexity (must always filter `deletedAt: null`). Offset by audit trail benefit and data recovery safety. |
| Prisma `$queryRaw` for trends | Minor loss of type safety vs raw SQL. Acceptable tradeoff for the expressiveness of `DATE_TRUNC` in trend queries. |
| No caching (Redis) | Dashboard queries run against the DB on every request. For an assessment this is fine; production would add a cache layer for the summary endpoints. |
| Category as FK, not string | More setup, but enables correct `GROUP BY` aggregation and prevents data inconsistency from typos in category names. |
| `Decimal(15, 2)` for amounts | Cannot store sub-cent precision. Sufficient for standard financial records; extend precision if needed. |

---

## 18. Deployment Notes

- Use `NODE_ENV=production` to suppress stack traces in error responses
- Run `prisma migrate deploy` (not `migrate dev`) in CI/CD pipelines
- Set `JWT_SECRET` to a minimum 256-bit random value in production
- Use a connection pool (Prisma handles this by default)
- Rate limit auth endpoints aggressively (e.g., 10 requests/15 min per IP)
- Set `CORS_ORIGIN` explicitly — never `*` in production
- Recommend deploying on Railway, Render, or any service with managed PostgreSQL

---

*Blueprint version 1.0 — Finance Dashboard Backend Assessment*
