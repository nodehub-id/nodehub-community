# Contributing to NodeHub Community Edition

Thanks for your interest in contributing to NodeHub! This guide will help you get set up and understand how we work.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How to Contribute

### Reporting Bugs

Found a bug? [Open a bug report](https://github.com/nodehub-id/nodehub-community/issues/new?template=bug_report.yml). Please include:

- Steps to reproduce the issue
- Expected vs actual behavior
- Your deployment method and environment details
- Relevant logs or error messages

### Suggesting Features

Have an idea? [Open a feature request](https://github.com/nodehub-id/nodehub-community/issues/new?template=feature_request.yml). Describe the problem you're trying to solve and your proposed solution.

> **Note:** Some features (smart routing, prompt compression, configurable similarity threshold) are part of the [Full Edition](https://nodehub.id). If you think a Full Edition feature should be in the Community Edition, explain your use case — we're open to discussion.

### Contributing Code

We welcome pull requests! Here's the process:

1. **Check existing issues** — look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue** — let us know you're working on it so we don't duplicate effort
3. **Fork and branch** — create a feature branch from `main`
4. **Make your changes** — follow the code style and patterns below
5. **Test locally** — make sure everything works
6. **Submit a PR** — fill out the PR template

## Development Setup

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm 9+** (package manager)
- **Docker** (for PostgreSQL with pgvector)
- **Git**

### Getting Started

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/nodehub-community.git
cd nodehub-community

# Install dependencies
pnpm install

# Start the database
docker compose up -d db

# Copy environment config
cp .env.example .env.local
# Edit .env.local with your settings (see below)

# Initialize the database
pnpm db:push

# Start the dev server
pnpm dev
```

Open http://localhost:3000 to see the dashboard.

### Environment Variables

At minimum, you need these in `.env.local`:

```bash
DATABASE_URL=postgresql://nodehub:nodehub@localhost:5432/nodehub
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-at-least-32-chars

# For semantic caching (choose one embedding provider):
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2

# Optional: add provider keys to test the API
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### Project Structure

```
nodehub-community/
├── apps/web/              # Next.js application
│   ├── src/
│   │   ├── app/           # App Router pages & API routes
│   │   ├── components/    # React components
│   │   ├── lib/           # Core logic (cache, providers, auth)
│   │   └── hooks/         # React hooks
│   └── ...
├── packages/
│   ├── core/              # Provider adapters, caching logic
│   ├── db/                # Database schema (Drizzle ORM)
│   └── shared/            # Shared types and utilities
├── docs/                  # Documentation
└── docker/                # Docker configuration
```

### Useful Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm lint             # Run linter
pnpm type-check       # TypeScript type checking
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)
```

## Code Style

### Tech Stack (Mandatory)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| UI | shadcn/ui (Neutral theme only) |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16+ with pgvector |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| Validation | Zod |

### Guidelines

- **TypeScript strict mode** — no `any` types unless absolutely necessary
- **Server Components by default** — only add `'use client'` when you need interactivity
- **shadcn/ui components only** — don't introduce MUI, Chakra, Ant Design, or other UI libraries
- **Drizzle ORM** — don't use Prisma or raw SQL (except for pgvector operations)
- **Zod for validation** — validate all API inputs and form data
- **Keep it simple** — this is a monolith, not microservices. No Redis, no message queues

### Naming Conventions

- **Files:** kebab-case (`api-key-table.tsx`, `cache-stats.ts`)
- **Components:** PascalCase (`ApiKeyTable`, `CacheStats`)
- **Functions/variables:** camelCase (`getCacheStats`, `isValidKey`)
- **Database columns:** snake_case (`created_at`, `cache_key`)
- **API routes:** follow Next.js App Router conventions

### Commit Messages

We use conventional commits:

```
feat: add Groq provider adapter
fix: correct semantic cache similarity calculation
docs: update deployment guide for Fly.io
test: add unit tests for cache TTL logic
refactor: simplify provider routing logic
chore: update dependencies
```

Format: `type: short description` (lowercase, no period at the end, max 72 chars)

## Pull Request Process

### Before You Start

- For **small fixes** (typos, minor bugs): go ahead and submit a PR directly
- For **new features or significant changes**: open an issue first to discuss the approach — this saves everyone time if the design needs adjustment

### Creating a Pull Request

1. **Branch from `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in small, focused commits

3. **Run checks locally before pushing:**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Push and open a PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub and fill out the template.

### Branch Naming

- `feature/` — new features (`feature/ollama-adapter`)
- `fix/` — bug fixes (`fix/cache-ttl-expiry`)
- `docs/` — documentation (`docs/api-reference`)
- `refactor/` — code improvements (`refactor/provider-base-class`)
- `test/` — test additions (`test/semantic-cache`)

### What We Look For in Reviews

- **Does it work?** — the change should be tested locally
- **Does it follow the patterns?** — consistent with existing code style
- **Is it focused?** — one PR should do one thing; don't bundle unrelated changes
- **Is it documented?** — new features should update relevant docs
- **Does it break anything?** — `pnpm lint`, `pnpm type-check`, and `pnpm test` should pass

### Review Timeline

We aim to review PRs within a few days. If your PR sits for more than a week without feedback, feel free to ping us in the comments.

## Priority Areas

These are the areas where contributions are most impactful right now:

1. **Provider adapters** — improving existing adapters or adding test coverage
2. **Dashboard components** — UI improvements using shadcn/ui
3. **Caching improvements** — better cache hit rates, edge cases
4. **Documentation** — setup guides, examples, troubleshooting
5. **Tests** — unit and integration test coverage

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/nodehub-id/nodehub-community/labels/good%20first%20issue) — these are scoped, well-described tasks suitable for first-time contributors.

## Questions?

- **GitHub Discussions:** https://github.com/nodehub-id/nodehub-community/discussions
- **Issues:** https://github.com/nodehub-id/nodehub-community/issues

## License

By contributing to NodeHub Community Edition, you agree that your contributions will be licensed under the [AGPL v3](LICENSE) license.