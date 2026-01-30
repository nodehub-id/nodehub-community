# NodeHub Community Edition

Self-hosted AI API Gateway with intelligent caching.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/nodehub-id/nodehub-community.git
cd nodehub-community

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 4. Start with Docker (recommended)
docker compose up -d

# 5. Open http://localhost:3000
# Login with your ADMIN_EMAIL and ADMIN_PASSWORD
```

## Features

- **OpenAI-compatible API** - Drop-in replacement for any tool
- **Semantic Caching** - 40-50% cost savings with pgvector
- **Web Dashboard** - Configure providers, view analytics
- **5 AI Providers** - OpenAI, Anthropic, Google, Groq, Ollama
- **Self-hosted** - Your data stays on your infrastructure
- **Free & Open Source** - AGPL v3 license

## Documentation

- [Setup Guide](./docs/SETUP.md)
- [API Reference](./docs/API.md)
- [Provider Configuration](./docs/PROVIDERS.md)
- [Environment Variables](./docs/ENVIRONMENT.md)

## License

GNU Affero General Public License v3.0 (AGPL-3.0)
