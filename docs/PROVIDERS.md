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

## Fallback Behavior

If multiple providers are enabled and one fails, NodeHub will automatically try the next available provider.

## Security

API keys are:
- Encrypted at rest in the database
- Never logged or exposed in responses
- Only shown once when created (for verification)

Rotate keys regularly and never commit them to version control.
