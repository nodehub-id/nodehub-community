# Architecture Overview

This document describes the architecture and codebase structure of NodeHub Community Edition.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User/Browser                               │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js Application                            │
│  ┌──────────────┬────────────────┬──────────────────────────┐  │
│  │  Dashboard   │   API Routes   │    Static Assets         │  │
│  │   (React)    │  (OpenAI-compat)│                         │  │
│  │              │                │                          │  │
│  │ - Overview   │ - /v1/chat/    │ - shadcn/ui              │  │
│  │ - API Keys   │   completions  │ - Charts                 │  │
│  │ - Providers  │ - /v1/models   │                          │  │
│  │ - Analytics  │ - /v1/embed    │                          │  │
│  │ - Caching    │                │                          │  │
│  │ - Settings   │                │                          │  │
│  └──────────────┴────────────────┴──────────────────────────┘  │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ SQL / Vector Operations
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL + pgvector                              │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │   Users     │ │  API Keys    │ │  Provider Configs    │    │
│  │   Auth      │ │  (hashed)    │ │  (encrypted)         │    │
│  └─────────────┘ └──────────────┘ └──────────────────────┘    │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │   Cache     │ │   Cache      │ │   Request            │    │
│  │   Entries   │ │   Stats      │ │   Logs               │    │
│  │   (vector)  │ │              │ │                      │    │
│  └─────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Providers                                  │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐       │
│  │ OpenAI │ │Anthropic │ │ Google │ │ Groq  │ │ Ollama │       │
│  │ API    │ │ API      │ │ API    │ │ API   │ │ Local  │       │
│  └────────┘ └──────────┘ └────────┘ └───────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
nodehub-community/
├── apps/
│   └── web/                    # Next.js 15 web application
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   │   ├── (auth)/    # Auth pages (login, register)
│       │   │   ├── (dashboard)/ # Dashboard pages (protected)
│       │   │   │   ├── page.tsx              # Overview
│       │   │   │   ├── api-keys/page.tsx     # API key management
│       │   │   │   ├── providers/page.tsx    # Provider config
│       │   │   │   ├── analytics/page.tsx    # Analytics charts
│       │   │   │   ├── caching/page.tsx      # Cache settings
│       │   │   │   └── settings/page.tsx     # User settings
│       │   │   ├── api/       # API routes
│       │   │   │   ├── v1/    # OpenAI-compatible API
│       │   │   │   │   ├── chat/completions/  # Main endpoint
│       │   │   │   │   ├── models/            # List models
│       │   │   │   │   └── embeddings/        # Embeddings
│       │   │   │   ├── keys/  # API key management
│       │   │   │   ├── providers/             # Provider config
│       │   │   │   ├── health/                # Health check
│       │   │   │   └── register/              # User registration
│       │   │   └── layout.tsx # Root layout
│       │   ├── components/
│       │   │   ├── ui/        # shadcn/ui components
│       │   │   ├── dashboard/ # Dashboard components
│       │   │   │   ├── sidebar.tsx    # Navigation sidebar
│       │   │   │   ├── header.tsx     # Page header
│       │   │   │   └── stats-card.tsx # Stats display
│       │   │   └── providers/ # Theme provider
│       │   ├── hooks/         # React hooks
│       │   └── lib/
│       │       ├── auth.ts    # NextAuth configuration
│       │       └── utils.ts   # Utility functions
│       └── package.json
│
├── packages/
│   ├── core/                  # Core business logic
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── base.ts           # Base provider interface
│   │   │   │   ├── openai.ts         # OpenAI adapter
│   │   │   │   ├── anthropic.ts      # Anthropic adapter
│   │   │   │   ├── google.ts         # Google/Gemini adapter
│   │   │   │   ├── groq.ts           # Groq adapter
│   │   │   │   ├── ollama.ts         # Ollama adapter
│   │   │   │   └── index.ts          # Provider factory
│   │   │   ├── cache/
│   │   │   │   ├── semantic.ts       # Semantic cache
│   │   │   │   └── index.ts
│   │   │   └── auth/
│   │   │       ├── api-keys.ts       # API key management
│   │   │       ├── password.ts       # Password hashing
│   │   │       ├── bootstrap.ts      # Admin creation
│   │   │       └── index.ts
│   │   └── package.json
│   │
│   ├── db/                    # Database layer
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── index.ts          # Schema exports
│   │   │   │   ├── user.ts           # User schema
│   │   │   │   ├── api-keys.ts       # API key schema
│   │   │   │   ├── providers.ts      # Provider config schema
│   │   │   │   ├── cache.ts          # Cache schema (pgvector)
│   │   │   │   └── analytics.ts      # Request logs schema
│   │   │   └── index.ts              # Database client
│   │   ├── drizzle.config.ts         # Drizzle config
│   │   └── package.json
│   │
│   └── shared/                # Shared code
│       ├── src/
│       │   ├── types/
│       │   │   └── index.ts          # TypeScript types
│       │   ├── validation/
│       │   │   └── index.ts          # Zod schemas
│       │   └── utils/
│       │       └── index.ts          # Utilities
│       └── package.json
│
├── docs/                      # Documentation
│   ├── SETUP.md
│   ├── API.md
│   ├── PROVIDERS.md
│   ├── DASHBOARD.md
│   ├── ENVIRONMENT.md
│   └── ARCHITECTURE.md (this file)
│
├── docker/
│   └── init-db.sql            # Database initialization
├── docker-compose.yml         # Docker Compose config
├── Dockerfile                 # Production build
└── package.json               # Root monorepo config
```

## Data Flow

### 1. API Request Flow

```
1. Client (IDE/Tool)
   ↓ Bearer token
2. /api/v1/chat/completions
   ↓ Validate API key
3. Check cache (SHA-256 hash)
   ↓ Cache miss
4. Find provider for model
   ↓ Provider lookup
5. Call provider API
   ↓ Response
6. Cache response
   ↓ Save to DB
7. Return to client
```

### 2. Dashboard Page Flow

```
1. Browser requests /dashboard/api-keys
   ↓ Middleware checks auth
2. Server renders page (RSC)
   ↓ Fetch data
3. Database queries
   ↓ Return data
4. React Server Component renders
   ↓ HTML sent
5. Client hydrates with interactivity
```

## Key Components

### Authentication System

**NextAuth.js v5 Configuration:**
- **Providers**: Credentials (email/password) + GitHub OAuth
- **Adapter**: Drizzle Adapter for PostgreSQL
- **Strategy**: JWT with 30-day session
- **Admin Bootstrap**: Creates first user from env vars

**API Key Authentication:**
- Keys format: `nh_<random-32-chars>`
- Storage: SHA-256 hashed in database
- Validation: Prefix + hash matching
- Usage tracking: Last used timestamp updated on each request

### Caching System

**Two-Layer Cache:**
1. **Exact Match**: SHA-256 hash of query
   - Fast lookup (~50ms)
   - Zero API cost on hit
2. **Semantic Match**: pgvector similarity
   - 1536-dimensional embeddings
   - Cosine similarity threshold: 0.95
   - Infrastructure ready, needs OpenAI for embeddings

**Cache Stats:**
- Daily aggregation (user_id, date)
- Tracks hits, misses, cost saved
- 7-day retention (Community Edition)

### Provider System

**Factory Pattern:**
```typescript
interface BaseProvider {
  chatCompletions(request): AsyncGenerator<Response>
  getModels(): string[]
  calculateCost(model, tokens): number
}
```

**Adapters:**
- OpenAI: Direct API compatibility
- Anthropic: Message format conversion
- Google: Gemini API
- Groq: OpenAI-compatible endpoint
- Ollama: Local HTTP API

**Routing:**
- Model name → Provider mapping
- Automatic provider selection
- Fallback chain if provider fails

## Database Schema

### Users & Auth
- `users`: Email, password hash, name
- `accounts`: OAuth accounts (GitHub)
- `sessions`: Session tokens
- `verification_tokens`: Email verification

### Features
- `api_keys`: API key storage (hashed, 1 per user in Community)
- `provider_configs`: Provider settings per user
- `cache_entries`: Cached responses with vector embeddings
- `cache_stats`: Daily cache statistics
- `request_logs`: Request analytics (7-day retention)

### Relations
```
User 1:N ApiKeys
User 1:N ProviderConfigs
User 1:N CacheEntries
User 1:N CacheStats
User 1:N RequestLogs
```

## Tech Stack Decisions

### Why Next.js 15?
- Full-stack in single framework
- App Router for Server Components
- API routes for OpenAI compatibility
- Excellent developer experience

### Why shadcn/ui (Neutral)?
- Accessible components out of the box
- Customizable via Tailwind
- Neutral theme matches professional tools
- No vendor lock-in

### Why PostgreSQL + pgvector?
- Single database for everything
- pgvector enables semantic search
- Simpler operations (no Redis needed)
- ACID compliance for data integrity

### Why Drizzle ORM?
- Type-safe SQL
- Lightweight and fast
- Better than Prisma for simple schemas
- Excellent TypeScript support

### Why Monorepo?
- Shared packages (core, db, shared)
- Clean separation of concerns
- Easy testing across packages
- Turbo for fast builds

## Security Considerations

### API Keys
- Never stored in plain text
- SHA-256 hashing with salt
- Prefix visible for identification
- One-time display on creation

### Provider Keys
- Encrypted at rest in database
- Optional: Can use environment variables
- Never exposed in API responses
- Per-user isolation

### Authentication
- bcrypt password hashing (10 rounds)
- JWT session tokens
- CSRF protection via NextAuth
- Secure cookie settings

## Performance Optimizations

### Database
- Indexes on frequently queried fields
- Composite indexes for common queries
- Connection pooling via postgres.js

### Caching
- 40-50% cache hit rate expected
- Sub-50ms lookup for exact matches
- TTL-based automatic cleanup

### Frontend
- Server Components by default
- Minimal client-side JavaScript
- Streaming for chat completions

## Development Guidelines

### Adding a New Provider
1. Create adapter in `packages/core/src/providers/`
2. Extend `BaseProvider` interface
3. Add to factory in `index.ts`
4. Add models to `PROVIDER_MODELS`
5. Add costs to `PROVIDER_COSTS`
6. Test with dashboard

### Adding a Dashboard Page
1. Create page in `apps/web/src/app/(dashboard)/<page>/`
2. Add route to sidebar in `sidebar.tsx`
3. Create API endpoint if needed
4. Add to documentation

### Database Changes
1. Update schema in `packages/db/src/schema/`
2. Run `pnpm db:push` to apply
3. Update types in shared package
4. Test migrations

## Deployment

### Docker (Recommended)
- Single command: `docker compose up -d`
- Includes PostgreSQL with pgvector
- Health checks configured
- Environment variables via .env

### Manual
- Requires Node.js 20+, pnpm, PostgreSQL 16+
- Install: `pnpm install`
- Database: `pnpm db:push`
- Start: `pnpm dev`

## Monitoring

### Health Checks
- `/api/health` - Database connectivity
- Docker healthcheck configured
- Returns 200 or 503 status

### Logs
- Request logging optional (ENABLE_REQUEST_LOGGING)
- Structured logging support
- Error tracking via console

## Future Considerations

### Scalability
- Current: Single instance, single database
- Future: Could add read replicas
- Future: Could add Redis for session cache
- Future: Could add load balancing

### Features (Community Edition)
- Semantic caching needs embeddings service
- Analytics could use materialized views
- Could add rate limiting middleware

### Upgrade Path
- Full Edition adds smart routing
- Full Edition adds multiple API keys
- Full Edition adds team features
- Same database schema, different features
