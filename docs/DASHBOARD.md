# Dashboard Guide

The NodeHub Dashboard provides a web interface for managing your AI API Gateway.

## Accessing the Dashboard

After starting NodeHub, open http://localhost:3000 in your browser.

**Default Login:**
- Use the admin credentials from your `.env` file (ADMIN_EMAIL and ADMIN_PASSWORD)
- Or create a new account via the registration page

---

## Dashboard Pages

### Overview (`/dashboard`)

The main dashboard showing your API usage at a glance.

**Features:**
- **Stats Cards**: Total requests, cache hit rate, cost saved, cost spent
- **Quick Navigation**: Cards linking to API Keys, Providers, and Analytics
- **Quick Start Guide**: Step-by-step instructions for setting up your IDE

**Usage:**
- View metrics for the last 7 days
- Click on any card to navigate to that section
- Follow the quick start guide to configure your tools

---

### API Keys (`/dashboard/api-keys`)

Manage your API keys for accessing NodeHub.

**Community Edition Limit:** 3 API keys maximum

**Features:**
- Create new API keys (limited to 3)
- View key details (name, prefix, status, creation date)
- Copy or delete existing keys
- See when keys were last used

**How to Use:**
1. Click "Create API Key"
2. Enter a name (e.g., "Production", "Development")
3. Copy the key immediately (shown only once!)
4. Use the key in your IDE or applications

**Security:**
- Keys are hashed in the database
- Only the prefix (first 10 chars) is displayed
- Keys can be revoked at any time

---

### Providers (`/dashboard/providers`)

Configure AI provider API keys for the 5 supported providers.

**Supported Providers:**
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Groq**: Llama 3.2, Mixtral
- **Ollama**: Local models (no API key needed)

**Features:**
- Enable/disable providers
- Enter and save API keys
- Test connection to verify keys work
- View all available models per provider

**How to Configure:**
1. Click the toggle to enable a provider
2. Enter your API key (get it from the provider's website)
3. Click "Save"
4. Click "Test Connection" to verify

**For Ollama:**
- No API key required
- Make sure Ollama is running locally: `ollama serve`
- NodeHub will automatically detect available models

---

### Analytics (`/dashboard/analytics`)

View detailed usage statistics and metrics.

**Features:**
- **Overview Stats**: Total requests, cache hit rate, cost metrics
- **Usage Over Time**: Bar chart showing daily request volume
- **Cache Performance**: Line chart comparing cache hits vs misses
- **Cost Breakdown**: Pie chart showing spending by provider
- **Provider Usage**: Bar chart showing requests per provider

**Data Retention:**
- Community Edition: 7 days
- Shows placeholder if no data available yet

**Metrics Tracked:**
- Total requests and costs
- Cache hit/miss rates
- Cost savings from caching
- Usage by provider and model

---

### Caching (`/dashboard/caching`)

View and manage semantic caching settings.

**Community Edition Settings:**
- **Semantic Caching**: Always enabled
- **Embedding Provider**: Local (Xenova/all-MiniLM-L6-v2, 384 dimensions)
- **Similarity Threshold**: 0.95
- **Default TTL**: 24 hours
- **Storage**: PostgreSQL + pgvector

**Features:**
- View current cache statistics
- Clear all cached responses (destructive action)
- See caching configuration details
- **No API key required** - embeddings run locally using @xenova/transformers

**Embedding Provider Options:**
You can optionally configure a different embedding provider via environment variables:
- **Local** (default): Xenova/all-MiniLM-L6-v2 - free, runs in-process
- **Ollama**: Self-hosted embeddings (e.g., nomic-embed-text)
- **HuggingFace TEI**: Text Embeddings Inference server
- **OpenAI**: text-embedding-3-small (requires API key)

See [ENVIRONMENT.md](./ENVIRONMENT.md) for configuration details.

**Upgrade Notice:**
Community Edition uses optimized caching settings. Full Edition allows:
- Configurable similarity threshold
- Dynamic TTL based on query type
- Response fragmentation
- Advanced analytics
- Dashboard-based embedding provider selection

---

### Settings (`/dashboard/settings`)

Manage your account and preferences.

**Features:**
- **Profile**: Update your name
- **Appearance**: Switch between Light, Dark, or System theme
- **Plan Information**: View Community Edition limitations

**Theme Options:**
- Light: Light background with dark text
- Dark: Dark background with light text
- System: Follows your OS preference

---

## Navigation

The sidebar on the left provides access to all dashboard pages:

1. **Overview** - Dashboard home with stats
2. **API Keys** - Manage API keys
3. **Providers** - Configure AI providers
4. **Caching** - View cache settings
5. **Analytics** - Usage statistics
6. **Settings** - Account and preferences

**User Menu:**
- Click your name in the sidebar to see account info
- Use "Sign Out" to log out

---

## First-Time Setup Checklist

1. [ ] Log in with admin credentials or create account
2. [ ] Go to **Providers** and enable at least one provider
3. [ ] Enter your API key for that provider
4. [ ] Test the connection to verify it works
5. [ ] Go to **API Keys** and create your API key
6. [ ] Copy the key (shown only once!)
7. [ ] Configure your IDE:
   - **Cursor**: Settings → OpenAI API Key → Custom API
     - Base URL: `http://localhost:3000/api/v1`
     - API Key: `nh-your-key`
   - **VS Code (Continue.dev)**:
     ```json
     {
       "models": [{
         "provider": "openai",
         "apiKey": "nh-your-key",
         "apiBase": "http://localhost:3000/api/v1"
       }]
     }
     ```
8. [ ] Start using AI in your IDE - requests will appear in **Analytics**

---

## Troubleshooting

**Dashboard not loading:**
- Check that the server is running: `docker compose ps`
- Check logs: `docker compose logs app`
- Clear browser cache and reload

**Can't log in:**
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in `.env`
- Check that database is running
- Look for "Default admin user created" in logs

**Providers not working:**
- Test connection on the Providers page
- Check that API keys are entered correctly
- Verify provider service is up (e.g., Ollama running)

**Analytics showing no data:**
- Normal until you make API requests
- Make some requests through your IDE
- Check back in a few minutes

---

## Tips

- **Dark Mode**: Toggle in Settings → Appearance
- **Security**: Never share your NodeHub API key
- **Cost Savings**: Enable multiple providers for automatic failover
- **Cache Hit Rate**: Should be 40-50% for typical usage
- **Local Development**: Use Ollama for free, unlimited local AI
