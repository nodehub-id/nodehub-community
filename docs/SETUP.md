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

### First-Time Setup

After logging in, complete these steps:

1. **Configure Providers**
   - Go to **Providers** in the dashboard
   - Enable at least one AI provider (OpenAI, Anthropic, Google, Groq, or Ollama)
   - Enter your API key for that provider
   - Click "Test Connection" to verify

2. **Create API Key**
   - Go to **API Keys**
   - Click "Create API Key"
   - Copy the key immediately (shown only once!)

3. **Configure Your IDE**
   - Use base URL: `http://localhost:3000/api/v1`
   - Use your API key: `nh-xxxxx...`
   - See [DASHBOARD.md](./DASHBOARD.md) for detailed IDE setup

**Next Steps:**
- Read the [Dashboard Guide](./DASHBOARD.md) to learn about all features
- See [API.md](./API.md) for API reference
- Check [PROVIDERS.md](./PROVIDERS.md) for provider-specific setup

## Troubleshooting

**Dashboard not loading:**
- Check server status: `docker compose ps`
- View logs: `docker compose logs app`
- Ensure ports are not in use: `netstat -an | grep 3000`

**Database connection errors:**
- Check that PostgreSQL is running: `docker compose ps db`
- Verify DATABASE_URL is correct in `.env`
- Ensure pgvector extension is installed (see docker/init-db.sql)

**Build errors:**
- Run `pnpm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf apps/web/.next`
- Restart dev server: `pnpm dev`

**UI Component errors (e.g., "Module not found: Can't resolve '@radix-ui/...'"):**
- Run `pnpm install` to install missing dependencies
- Some shadcn/ui components may require manual installation

**Authentication issues:**
- Verify AUTH_SECRET is set and at least 32 characters
- Check that cookies are enabled in your browser
- Look for "Default admin user created" message in startup logs
- If you get "User not found" error when saving provider settings:
  - Your session may reference a deleted user
  - **Solution:** Sign out and sign back in to recreate your user session
- If locked out, check database directly: `docker compose exec db psql -U nodehub -c "SELECT * FROM users;""
