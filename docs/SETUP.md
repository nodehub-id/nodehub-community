# Setup Guide

## Prerequisites

- Docker and Docker Compose
- Or: Node.js 20+, pnpm 9+, PostgreSQL 16+

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/nodehub-id/nodehub-community.git
cd nodehub-community

# 2. Configure environment
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL (optional, defaults to docker db)
# - AUTH_SECRET (required, generate with: openssl rand -base64 32)
# - ADMIN_EMAIL (required for first admin user)
# - ADMIN_PASSWORD (required for first admin user)

# 3. Start with Docker Compose
docker compose up -d

# 4. Open http://localhost:3000
# Login with ADMIN_EMAIL and ADMIN_PASSWORD
```

## Manual Setup (without Docker)

### 1. Database Setup

You need PostgreSQL 16+ with pgvector extension:

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name nodehub-db \
  -e POSTGRES_USER=nodehub \
  -e POSTGRES_PASSWORD=nodehub \
  -e POSTGRES_DB=nodehub \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Option B: Existing Database**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

### 4. Database Setup

```bash
pnpm db:push
```

### 5. Run Development Server

```bash
pnpm dev
```

## Configuration

### Environment Variables

See [.env.example](../.env.example) for all available options.

### First-Time Setup

The first time you run NodeHub, it will create an admin user from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. After the first user is created, you can create additional users through the web interface.

### Provider Configuration

After logging in, go to **Providers** in the dashboard to configure your AI provider API keys.

## Troubleshooting

**Database connection errors:**
- Check that PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure pgvector extension is installed

**Build errors:**
- Run `pnpm install` to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf apps/web/.next`

**Authentication issues:**
- Verify AUTH_SECRET is set and at least 32 characters
- Check that cookies are enabled in your browser
