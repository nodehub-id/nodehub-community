# NodeHub Community Edition

Self-hosted AI API Gateway with intelligent caching. Cut AI costs by 40-70% with zero code changes.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-AGPL%20v3-green)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/nodehub-id/nodehub-community.git
cd nodehub-community

# 2. Configure environment
cp .env.example .env
# Edit .env and set:
#   - DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (required)
#   - Provider API keys (optional - configure in dashboard)

# 3. Start with Docker (recommended)
docker compose up -d

# 4. Open http://localhost:3000
# Login with your ADMIN_EMAIL and ADMIN_PASSWORD

# 5. Configure and use:
# - Add your AI provider API keys in Dashboard → Providers
# - Create an API key in Dashboard → API Keys
# - Configure your IDE (Cursor, Continue.dev, etc.)
```

## Features

### Core Features
- **OpenAI-compatible API** - Drop-in replacement for any tool (Cursor, Continue.dev, Cline, etc.)
- **Vision Support** - Images in chat (GPT-4o, Claude, Gemini)
- **Semantic Caching** - 40-50% cost savings using pgvector similarity matching
- **Web Dashboard** - Complete UI for configuration and monitoring
- **5 AI Providers** - OpenAI, Anthropic, Google, Groq, Ollama (local)
- **Dynamic Ollama Support** - Use any model from your local Ollama instance automatically
- **Self-hosted** - Your data stays on your infrastructure
- **Free & Open Source** - AGPL v3 license

### Dashboard Features
- **Overview** - Stats, quick navigation, quick start guide
- **API Keys** - Manage API keys (1 key limit in Community Edition)
- **Providers** - Configure all 5 AI providers with test connections
- **Analytics** - Usage charts, cost tracking, cache performance
- **Caching** - View cache status and configuration
- **Settings** - Profile management and theme (light/dark/system)

### API Endpoints
- `POST /api/v1/chat/completions` - Chat completions with streaming
- `GET /api/v1/models` - List available models
- `POST /api/v1/embeddings` - Generate embeddings

### Caching
- **Exact Match** - SHA-256 hash-based fast lookup (~5ms)
- **Semantic Match** - pgvector cosine similarity search (~50ms)
  - Uses local embeddings via @xenova/transformers (Xenova/all-MiniLM-L6-v2, 384 dimensions)
  - Fixed similarity threshold: 0.95
  - **No API key required** - works out of the box
  - Optional: Configure OpenAI, Ollama, or other embedding providers
- **TTL** - 24-hour default cache expiration
- **Stats** - Daily cache hit/miss tracking

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **UI:** shadcn/ui (Neutral theme)
- **Database:** PostgreSQL 16+ with pgvector
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5 (Credentials + GitHub OAuth)
- **Charts:** Recharts
- **Package Manager:** pnpm
- **Build:** Turbo

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](./docs/SETUP.md) | Installation and setup instructions |
| [API Reference](./docs/API.md) | OpenAI-compatible API documentation |
| [Provider Configuration](./docs/PROVIDERS.md) | AI provider setup guide |
| [Dashboard Guide](./docs/DASHBOARD.md) | Web dashboard documentation |
| [Environment Variables](./docs/ENVIRONMENT.md) | All configuration options |
| [Architecture](./docs/ARCHITECTURE.md) | Codebase structure and design |

## Project Structure

```
nodehub-community/
├── apps/web/              # Next.js web application
├── packages/
│   ├── core/              # Provider adapters, caching, auth
│   ├── db/                # Database schema (Drizzle)
│   └── shared/            # Types, validation, utilities
├── docs/                  # Documentation
├── docker-compose.yml     # Docker setup
└── README.md
```

## Community Edition vs Full Edition

| Feature | Community | Full Pro | Full Team |
|---------|-----------|----------|-----------|
| **Price** | Free | $49/mo + usage | $149/mo + $25/user + usage |
| **Deployment** | Self-hosted | SaaS (nodehub.id) | SaaS (nodehub.id) |
| **API Keys** | 1 | 10 | Unlimited |
| **Providers** | 5 | 20+ | 20+ |
| **Caching** | Basic (0.95 fixed) | Advanced (55-70%) | Advanced (55-70%) |
| **Smart Routing** | ❌ | ✅ | ✅ |
| **Analytics** | 7 days | 90 days | 365 days |
| **Support** | Community | Email | Dedicated |

[Learn more about Full Edition →](https://nodehub.id)

## Contributing

Community Edition is open source! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

GNU Affero General Public License v3.0 (AGPL-3.0)

For commercial use, consider the Full Edition with a commercial license.
