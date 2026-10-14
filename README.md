# Open Fabric — Authentication & Authorization Service

A production-quality OAuth2 JWT validation and fine-grained permission authorization REST API built with Node.js, TypeScript, Express, and SQLite.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Auth0 Setup](#auth0-setup)
5. [Environment Variables](#environment-variables)
6. [Database Initialization](#database-initialization)
7. [Running the Server](#running-the-server)
8. [API Reference](#api-reference)
9. [Resource Mapping & Wildcard Semantics](#resource-mapping--wildcard-semantics)
10. [Authorization Engine](#authorization-engine)
11. [Conflicting Sample Scenario](#conflicting-sample-scenario)
12. [Running Tests](#running-tests)
13. [Security Considerations](#security-considerations)
14. [Limitations & Improvements](#limitations--improvements)
15. [GitHub Submission](#github-submission)

---

## Architecture

```
POST /authorize
       │
       ▼
┌─────────────────────┐
│  Express Middleware  │  helmet, rate-limit, JSON body parse
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Request Validation │  schemas/authorize.schema.ts
│  (method, path,     │  Rejects invalid input with HTTP 400
│   access_token)     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Token Service      │  services/token.service.ts
│  (jose + JWKS)      │  Verifies JWT signature, expiry,
│                     │  issuer, audience → extracts sub
└─────────┬───────────┘
          │ verified sub (user_id)
          ▼
┌─────────────────────┐
│ Authorization Svc   │  services/authorization.service.ts
│  normalize path →   │  Specificity-based rule selection
│  lookup permissions │  Deny-wins conflict resolution
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Permission Repo     │  repositories/permission.repository.ts
│ (SQLite)            │  Parameterized queries only
└─────────────────────┘
          │
          ▼
   { decision, user_id, reason, matched_permissions }
```

### Module Responsibilities

| File | Responsibility |
|------|---------------|
| `src/server.ts` | HTTP server entry, graceful shutdown |
| `src/app.ts` | Express middleware, routes, error handlers |
| `src/config/env.ts` | Environment variable validation |
| `src/config/database.ts` | SQLite initialization |
| `src/middleware/error-handler.ts` | Centralized error → HTTP response mapping |
| `src/routes/authorize.routes.ts` | Route registration |
| `src/controllers/authorize.controller.ts` | HTTP in/out, delegates to services |
| `src/services/token.service.ts` | JWT cryptographic verification |
| `src/services/authorization.service.ts` | Permission decision engine |
| `src/repositories/permission.repository.ts` | SQLite queries |
| `src/utils/resource-matcher.ts` | Path normalization and wildcard matching |
| `src/schemas/authorize.schema.ts` | Request body validation |
| `src/types/authorization.ts` | Shared TypeScript types |

---

## Prerequisites

- **Node.js** ≥ 22.5.0 (Node.js 22+ includes native `node:sqlite` with zero native compilation dependencies)
- **npm** ≥ 9.0.0
- An **Auth0** tenant (or compatible OIDC provider) — see [Auth0 Setup](#auth0-setup)

---

## Installation

```powershell
# Clone the repository
git clone <your-repo-url>
cd open-fabric-auth-service

# Install dependencies
npm install

# Copy the example environment file
Copy-Item .env.example .env
```

---

## Auth0 Setup

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com/).
2. **Create an API**:
   - Go to **Applications → APIs → Create API**.
   - Set a **Name** (e.g., `Open Fabric Auth API`) and an **Identifier** (e.g., `https://api.openfabric.io`).
   - Save the identifier — this becomes `AUTH0_API_AUDIENCE`.
3. **Note your tenant domain** (e.g., `your-tenant.us.auth0.com`) — this becomes `AUTH0_DOMAIN`.
4. **Create a Machine-to-Machine or Single Page Application** for generating test tokens.
5. In the API settings, ensure **RS256** is selected as the signing algorithm (default).

---

## Environment Variables

Copy `.env.example` to `.env.local` (or `.env`) and fill in your values:

```dotenv
# Auth0 tenant domain (without https://)
AUTH0_DOMAIN=your-tenant.us.auth0.com

# Auth0 API audience identifier
AUTH0_API_AUDIENCE=https://api.openfabric.io

# JWT issuer URL (usually https://<AUTH0_DOMAIN>/)
AUTH0_ISSUER=https://your-tenant.us.auth0.com/

# Server port (default: 8080)
PORT=8080

# SQLite database path
DATABASE_PATH=./data/permissions.db

# Node environment: development | production | test
NODE_ENV=development
```

> **Never commit `.env` or `.env.local` to source control.** Both are listed in `.gitignore`.

---

## Database Initialization

The database schema is created automatically on server start (or seeding). Existing tables are **never dropped** — this preserves any pre-populated assignment data.

### Seed the sample dataset

```powershell
npm run db:seed
```

This inserts the complete assignment sample permissions:

| user_id  | action | resource                         | effect |
|----------|--------|----------------------------------|--------|
| user123  | read   | transactions                     | allow  |
| user123  | write  | transactions                     | allow  |
| user123  | delete | transactions                     | deny   |
| user123  | read   | accounts                         | allow  |
| user456  | read   | wallets/*                        | allow  |
| user456  | write  | wallets/wallet-789               | allow  |
| user456  | read   | wallets/wallet-789/transactions  | allow  |
| user789  | write  | wallets/*/transactions           | allow  |
| user789  | write  | wallets/*/transactions/*         | allow  |
| admin789 | read   | *                                | allow  |
| admin789 | write  | *                                | allow  |
| admin789 | delete | *                                | allow  |

> **Idempotent**: If the table already has data, seeding is skipped to preserve existing records.

### Reuse a supplied database

If you have been provided a pre-populated `.db` file, place it at the path specified by `DATABASE_PATH`. The server will use it as-is and only create missing schema objects.

---

## Running the Server

```powershell
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

The server starts at `http://localhost:8080` (or the `PORT` in your `.env.local` / `.env`).

- **API docs**: `http://localhost:8080/docs`
- **Health check**: `http://localhost:8080/health`

---

## Frontend Web Application (OpenGuard UI)

A modern, responsive, developer-friendly web application built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

### Running the Frontend

```powershell
# In a new terminal tab:
npm run client:dev
```

The frontend will start at **`http://localhost:5173`**.

Vite automatically proxies all `/api/*` requests to the backend server on `http://localhost:8080`, allowing real-time interactive testing without CORS issues.

### Production Build

```powershell
npm run client:build
```

### UI Features & Routes

- **`/` — Marketing Landing Page**: Hero section, architecture overview, core capabilities, and technical stack.
- **`/login` & `/signup` — Authentication**: Clean login & registration flows with Auth0 Universal Login integration and development sandbox mode.
- **`/dashboard` — Security Overview**: Real-time evaluation metrics, requests-over-time traffic chart, ALLOW vs DENY distribution, and recent decisions table.
- **`/playground` — Interactive API Playground**: Test live `POST /authorize` calls directly against the backend with token masking, preset scenarios, latency measurement, and JSON output viewer.
- **`/permissions` — Policy Management**: Rules table for SQLite permissions, wildcard and specificity logic help panel, and rule staging modal.
- **`/users` — Client & User Directory**: Directory of authenticated principals with details drawer and active policy count.
- **`/logs` — Security Audit Logs**: Chronological log of authorization requests with filters for decision and method, search, and CSV export.
- **`/docs` — Interactive API Documentation**: Complete endpoint reference, method-to-action mappings, wildcard semantics, and error codes.
- **`/settings` — System Settings**: Backend connectivity status check, Auth0 JWKS configuration, and light/dark appearance preferences.

---

## API Reference

### `POST /authorize`

Evaluate whether an authenticated user is permitted to perform an action on a resource.

#### Request Body

```json
{
  "access_token": "<OAuth2 Bearer JWT>",
  "method": "GET | POST | PUT | PATCH | DELETE",
  "path": "/wallets/wallet-789/transactions"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `access_token` | string | ✅ | OAuth2 access token (JWT). Verified cryptographically. |
| `method` | string | ✅ | HTTP method. Maps to an action (see below). |
| `path` | string | ✅ | API resource path, must start with `/`. |

#### Method → Action Mapping

| HTTP Method | Action |
|-------------|--------|
| GET | read |
| POST | write |
| PUT | write |
| PATCH | write |
| DELETE | delete |

#### Response (200 OK)

```json
{
  "decision": "ALLOW",
  "user_id": "user123",
  "reason": "Permission granted for user \"user123\" on \"transactions\" (action: \"read\").",
  "matched_permissions": [
    { "action": "read", "resource": "transactions", "effect": "allow" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `decision` | `"ALLOW" \| "DENY"` | Authorization decision. |
| `user_id` | string | Authenticated subject from the verified JWT (`sub` claim). |
| `reason` | string | Human-readable explanation of the decision. |
| `matched_permissions` | array | Permission records that drove the decision (most-specific match only). |

#### Error Responses

| Status | Error Code | Cause |
|--------|-----------|-------|
| 400 | `VALIDATION_ERROR` | Missing field, invalid method, empty string, path without `/`. |
| 400 | `INVALID_JSON` | Malformed JSON body. |
| 401 | `AUTHENTICATION_ERROR` | Expired, malformed, wrong issuer/audience, or invalid signature. |
| 404 | `NOT_FOUND` | Unknown route. |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error. |

#### cURL Examples

```bash
# ALLOW: user123 reads transactions
curl -X POST http://localhost:3000/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<your_jwt>",
    "method": "GET",
    "path": "/transactions"
  }'

# DENY: user123 deletes a specific transaction
curl -X POST http://localhost:3000/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<your_jwt>",
    "method": "DELETE",
    "path": "/transactions/txn-456"
  }'

# ALLOW: admin789 deletes anything
curl -X POST http://localhost:3000/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<admin_jwt>",
    "method": "DELETE",
    "path": "/accounts/acc-123/settings"
  }'
```

### `GET /health`

```bash
curl http://localhost:3000/health
# { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### `GET /docs`

Returns interactive JSON API documentation.

---

## Resource Mapping & Wildcard Semantics

### Path Normalization

API paths are normalized to canonical resource strings:

| API Path | Resource String |
|----------|----------------|
| `/transactions` | `transactions` |
| `/wallets/wallet-789/transactions` | `wallets/wallet-789/transactions` |
| `/accounts/acc-123/settings` | `accounts/acc-123/settings` |

The normalization:
1. Strips the leading `/`
2. Strips trailing `/`
3. Collapses consecutive `//` to single `/`
4. Rejects path traversal (`..`) sequences

### Wildcard Semantics

| Pattern | Matches | Does Not Match |
|---------|---------|----------------|
| `*` | Any resource at any depth | — |
| `wallets/*` | `wallets/wallet-789` | `wallets/wallet-789/transactions` |
| `wallets/*/transactions` | `wallets/wallet-789/transactions`, `wallets/wallet-456/transactions` | `wallets/wallet-789`, `wallets/wallet-789/transactions/txn-1` |
| `wallets/*/transactions/*` | `wallets/wallet-456/transactions/txn-999` | `wallets/wallet-789/transactions` |

**Rules:**
- `*` in a pattern matches exactly **one** path segment (except the bare global `*`).
- Bare `*` matches any resource at any depth.
- Matching is always **segment-based**, never substring-based.
- Pattern and resource must have the **same number of segments** (except bare `*`).

---

## Authorization Engine

### Decision Algorithm

1. Normalize the API path to a canonical resource string.
2. Map the HTTP method to an action (`read | write | delete`).
3. Query SQLite for all permissions matching `(user_id, action)`.
4. Filter to those whose resource pattern matches the requested resource.
5. Compute specificity scores for all matching rules.
6. Select the rules with the **highest** specificity score (most specific).
7. If no rules match → **DENY** (default-deny).
8. If any top-specificity rule has `effect = deny` → **DENY**.
9. Otherwise → **ALLOW**.

### Specificity Scoring

```
score = (number_of_literal_segments × 1000) − (number_of_wildcard_segments)
```

| Pattern | Score | Explanation |
|---------|-------|-------------|
| `*` | 0 | Global wildcard |
| `wallets/*` | 999 | 1 literal (1000) + 1 wildcard (−1) |
| `wallets/*/transactions` | 1999 | 2 literals (2000) + 1 wildcard (−1) |
| `wallets/*/transactions/*` | 1998 | 2 literals (2000) + 2 wildcards (−2) |
| `wallets/wallet-789` | 2000 | 2 literals |
| `wallets/wallet-789/transactions` | 3000 | 3 literals |

### Conflict Resolution

- **DENY wins** among equally specific conflicting rules (principle of least privilege).
- A more-specific matching rule supersedes a less-specific one.
- Default **DENY** applies when no rule matches.

### Parent Resource Inheritance

**Permissions are NOT inherited by descendant resources.**

A permission on `wallets/wallet-789` does **not** grant access to `wallets/wallet-789/transactions`. Only database patterns that explicitly match the full requested resource (exact or via wildcards) are considered.

This prevents accidental privilege escalation.

---

## Conflicting Sample Scenario

The assignment data includes what appears to be a conflicting scenario:

- `user456` has `write: allow` on `wallets/wallet-789`
- The sample test expects `POST /wallets/wallet-789/transactions → DENY` for `user456`

**Analysis:**

If parent resources inherited permissions to their descendants, `write` on `wallets/wallet-789` would grant write access to `wallets/wallet-789/transactions`, producing `ALLOW`.

**Chosen resolution:**

This service implements **no parent inheritance**. The resource pattern `wallets/wallet-789` (2 segments) is matched against the requested resource `wallets/wallet-789/transactions` (3 segments). Because the segment counts differ, there is no match. No applicable write rule exists for `user456` on a 3-segment wallet-transactions resource, so the result is `DENY`.

The `write: allow` permission on `wallets/wallet-789` is **preserved** in the database exactly as specified in the assignment.

**user789 collection vs. item access:**

The assignment sample data only specifies `wallets/*/transactions/*` for `user789`. However, the sample test requires `POST /wallets/wallet-789/transactions` (3-segment path) to be `ALLOW`. Since `wallets/*/transactions/*` requires 4 segments, an additional permission `wallets/*/transactions` was added to the seed dataset to cover collection-level writes. This is explicitly documented and tested.

---

## Running Tests

### All tests (unit + integration)

```powershell
npm test
```

### Watch mode

```powershell
npm run test:watch
```

### Type checking only

```powershell
npm run typecheck
```

### Build

```powershell
npm run build
```

### Test Architecture

Tests are completely isolated from live Auth0:
- A real RSA-2048 key pair is generated at test startup.
- A lightweight local HTTP server serves the JWKS (public key).
- The `TokenService` is configured to use this local JWKS URL.
- All tokens are signed with the test private key.
- SQLite databases use `:memory:` — no files on disk.

### Test Coverage

| Category | Tests |
|----------|-------|
| Resource normalization | `normalizePath` edge cases |
| Wildcard matching | All pattern combinations |
| Specificity scoring | Literal vs wildcard ordering |
| JWT validation | Valid, expired, wrong audience/issuer/key, malformed |
| Authorization engine | All 8 sample scenarios + conflict resolution |
| Integration | Full HTTP cycle for all scenarios |
| Error handling | 400, 401, 404, 500 |

---

## Security Considerations

- **JWKS caching**: `jose` caches public keys and auto-rotates on JWKS failures.
- **Algorithm enforcement**: Only `RS256` is accepted (configured via `algorithms`).
- **Parameterized SQL**: All queries use prepared statements — no SQL injection risk.
- **Helmet**: Security headers on all responses.
- **Rate limiting**: Configurable; defaults to 100 requests/minute.
- **No token logging**: Raw access tokens are never written to logs.
- **Input validation**: All request fields validated before any processing.
- **No stack traces in production**: `errorHandler` suppresses internal details when `NODE_ENV=production`.
- **Default deny**: Any request without a matching allow rule is denied.
- **No secret leakage**: `.env`, `*.db` files excluded from Git via `.gitignore`.

---

## Limitations & Improvements

### Current Limitations

- No token revocation / blacklist support.
- No audit logging of authorization decisions.
- Single-tenant (one Auth0 domain per deployment).
- Permissions are stored and evaluated per exact user ID; no role or group support.
- No caching of permission lookups (each request hits SQLite).

### Possible Improvements

- **Caching**: Add an in-memory LRU cache (e.g., `lru-cache`) for permission lookups keyed by `(user_id, action)`.
- **Role-based access**: Extend the schema with a `roles` table and resolve user roles at request time.
- **Audit log**: Persist authorization decisions to a separate table or external log sink.
- **Metrics**: Expose Prometheus metrics via a `/metrics` endpoint.
- **OpenAPI spec**: Generate a `swagger.json` using `swagger-jsdoc`.
- **Token revocation**: Integrate with Auth0's token introspection endpoint.
- **Multi-tenancy**: Partition permissions by `tenant_id`.

---

## GitHub Submission

1. Ensure `.env` and `*.db` files are **not committed** (verified by `.gitignore`).
2. Verify all tests pass: `npm test`
3. Verify the build succeeds: `npm run build`
4. Verify type checking: `npm run typecheck`
5. Push to your repository.

### Demo video guide (2–3 minutes)

1. Show `npm install` and `npm test` passing.
2. Start the server: `npm run dev`
3. Seed the database: `npm run db:seed`
4. Show a successful `ALLOW` request with `curl`.
5. Show a `DENY` request for the conflict scenario.
6. Show a `401` response for an expired/invalid token.
7. Briefly walk through the architecture diagram in this README.

---

## Starting the Server

```powershell
# 1. Install dependencies
npm install

# 2. Configure environment
Copy-Item .env.example .env
# Edit .env with your Auth0 credentials

# 3. Seed the database
npm run db:seed

# 4. Start the development server
npm run dev
```

Server will be available at: **http://localhost:3000**
