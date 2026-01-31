# Provider Configuration

NodeHub Community Edition supports 5 AI providers.

## Supported Providers

| Provider | Models | Cost |
|----------|--------|------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo | $ per token |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku | $ per token |
| **Google** | Gemini 1.5 Pro, Gemini 1.5 Flash | $ per token |
| **Groq** | Llama 3.2 70B, Mixtral 8x7b | $ per token |
| **Ollama** | Any local model | Free (self-hosted) |

## Configuration

### Dashboard

1. Go to **Providers** in the dashboard
2. Enable the provider you want to use
3. Enter your API key
4. Click **Test Connection** to verify

### Environment Variables

You can also configure providers via environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...

# Groq
GROQ_API_KEY=gsk_...

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key

### Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Create a new key
3. Copy the key

### Google
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key

### Groq
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy the key

### Ollama
No API key needed! Just install Ollama locally:
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

## Model Selection

When you make an API request, specify the model in your request:

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer nh_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

NodeHub will automatically route to the correct provider based on the model name.

**Available Models:**

| Model | Provider | Use Case |
|-------|----------|----------|
| `gpt-4o` | OpenAI | Best overall performance |
| `gpt-4o-mini` | OpenAI | Fast, cost-effective |
| `claude-3-5-sonnet-latest` | Anthropic | Excellent for complex tasks |
| `claude-3-opus-latest` | Anthropic | Most capable (expensive) |
| `gemini-1.5-pro` | Google | Good for long context |
| `gemini-1.5-flash` | Google | Fast responses |
| `llama-3.2-70b` | Groq | Fast inference |
| `mixtral-8x7b` | Groq | Balanced performance |
| Any local model | Ollama | Free, private |

### Ollama Model Support

NodeHub supports **any model** available in your local Ollama instance. When you make a request with a model name:

1. NodeHub checks if the model exists in your configured Ollama instance
2. If found, the request is routed to Ollama automatically
3. No pre-configuration of model names is required

**Example with Ollama:**
```bash
# Pull a model in Ollama
ollama pull llama3.2:1b

# Use it immediately via API
curl http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer nh_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Supported Ollama Models:**
- `llama3.2`, `llama3.2:1b` - Meta's Llama 3.2
- `mistral`, `mistral:7b` - Mistral AI models
- `phi4` - Microsoft's Phi-4
- `qwen2.5` - Alibaba's Qwen
- `gemma2` - Google's Gemma
- And any other model you pull into Ollama

List all available models: `GET /api/v1/models`

**Note:** The models endpoint returns both cloud provider models and dynamically detected Ollama models.

## Fallback Behavior

If multiple providers are enabled and one fails, NodeHub will automatically try the next available provider based on your enabled providers list.

## Security

API keys are:
- Encrypted at rest in the database
- Never logged or exposed in responses
- Only shown once when created (for verification)

Rotate keys regularly and never commit them to version control.
