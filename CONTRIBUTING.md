# Contributing to NodeHub Community Edition

Thank you for your interest in contributing!

## Development Setup

1. **Prerequisites**
   - Node.js 20+
   - pnpm 9+
   - Docker (for PostgreSQL)

2. **Install**
   ```bash
   pnpm install
   ```

3. **Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start Development**
   ```bash
   docker compose up -d db
   pnpm db:push
   pnpm dev
   ```

## Project Structure

- `apps/web/` - Next.js web application
- `packages/db/` - Database schema and client
- `packages/core/` - Business logic (providers, cache)
- `packages/shared/` - Types and utilities

## Code Style

- TypeScript strict mode
- Follow existing patterns
- Write tests for new features
- Use shadcn/ui components

## Commit Messages

Format: `type: description`

Types: `feat`, `fix`, `docs`, `test`, `refactor`

## License

By contributing, you agree that your contributions will be licensed under the AGPL v3.
