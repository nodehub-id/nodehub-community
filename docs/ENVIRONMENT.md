# Environment Variables

## Required

### DATABASE_URL
PostgreSQL connection string.

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Default:** `postgresql://nodehub:nodehub@localhost:5432/nodehub`

### AUTH_SECRET
Session encryption secret. Must be at least 32 characters.

**Generate:**
```bash
openssl rand -base64 32
```

**Example:**
```bash
AUTH_SECRET=your-secret-key-here-minimum-32-characters-long
```

### ADMIN_EMAIL & ADMIN_PASSWORD
Default admin credentials for first-time setup.

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

These are only used to create the first admin user when no users exist in the database.

## Optional

### OAuth Providers

#### GITHUB_ID & GITHUB_SECRET
For GitHub OAuth login (optional).

1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret

```bash
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### Provider API Keys

Can also be configured via dashboard. Environment variables take precedence.

#### OPENAI_API_KEY
OpenAI API key for GPT models (GPT-4o, GPT-4o-mini, etc.).

```bash
OPENAI_API_KEY=sk-...
```

**Note:** Semantic caching works out of the box using local embeddings (Xenova/all-MiniLM-L6-v2). No OpenAI key required for caching. This key is only needed if you want to use OpenAI models or configure OpenAI as your embedding provider.

#### Other Provider Keys
```bash
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
OLLAMA_BASE_URL=http://localhost:11434
```

### Embedding Provider Configuration

Semantic caching uses local embeddings by default (no configuration needed). To use a different embedding provider:

#### EMBEDDING_PROVIDER
Choose embedding provider: `local` (default), `ollama`, `huggingface-tei`, `openai`

```bash
EMBEDDING_PROVIDER=local
```

**Default:** `local` - Uses Xenova/all-MiniLM-L6-v2 model (384 dimensions, no API key required)

#### EMBEDDING_MODEL
Override the default model for your chosen provider:

```bash
# For local provider (Xenova/transformers)
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2

# For Ollama provider
EMBEDDING_MODEL=nomic-embed-text

# For OpenAI provider
EMBEDDING_MODEL=text-embedding-3-small
```

#### Provider-Specific URLs
```bash
# Ollama embedding server URL
EMBEDDING_OLLAMA_URL=http://localhost:11434

# HuggingFace Text Embeddings Inference URL
EMBEDDING_TEI_URL=http://localhost:8080
```

#### OPENAI_API_KEY (for embeddings)
If using OpenAI as your embedding provider:

```bash
OPENAI_API_KEY=sk-...
EMBEDDING_PROVIDER=openai
```

### Server Configuration

#### NEXTAUTH_URL
Public URL of your app (required for OAuth in production).

```bash
NEXTAUTH_URL=https://your-domain.com
```

**Default:** `http://localhost:3000`

#### PORT
Server port.

**Default:** `3000`

#### LOG_LEVEL
Log verbosity: `debug`, `info`, `warn`, `error`

**Default:** `info`

### Privacy & Security

#### ENABLE_REQUEST_LOGGING
Enable request logging for debugging (disabled by default for privacy).

```bash
ENABLE_REQUEST_LOGGING=false
```

**Default:** `false`

### Data Retention & Cleanup

NodeHub automatically cleans up old analytics data to manage database size.
Cleanup runs probabilistically during API requests (no external cron needed).

#### ANALYTICS_RETENTION_DAYS
Number of days to retain analytics data (request logs, cache stats).

```bash
ANALYTICS_RETENTION_DAYS=7
```

**Default:** `7` (Community Edition)

#### CLEANUP_ENABLED
Enable or disable automatic cleanup.

```bash
CLEANUP_ENABLED=true
```

**Default:** `true`

#### CLEANUP_PROBABILITY
Probability of running cleanup on each API request (0-1).
Higher values mean more frequent cleanup but slightly more overhead.

```bash
CLEANUP_PROBABILITY=0.01
```

**Default:** `0.01` (1% of requests trigger cleanup check)

## Docker Environment

When using Docker Compose, set variables in `.env` file or pass them directly:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password docker compose up -d
```

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong passwords** for admin account
3. **Rotate API keys** regularly
4. **Use HTTPS** in production
5. **Keep AUTH_SECRET secret** - treat it like a password
