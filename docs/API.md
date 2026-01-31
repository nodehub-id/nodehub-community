# API Reference

NodeHub provides an OpenAI-compatible API at `/api/v1/`.

## Authentication

All API requests require authentication via Bearer token:

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer nh_your_api_key" \
  -H "Content-Type: application/json"
```

## Endpoints

### Chat Completions

**Endpoint:** `POST /api/v1/chat/completions`

**Request Body:**
```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 12,
    "total_tokens": 37
  },
  "nodehub": {
    "cache_hit": false
  }
}
```

### Streaming

Set `stream: true` for SSE streaming:

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer nh_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### List Models

**Endpoint:** `GET /api/v1/models`

Returns all available models from configured providers, including dynamically detected Ollama models.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    },
    {
      "id": "llama3.2:1b",
      "object": "model",
      "created": 1677610602,
      "owned_by": "ollama"
    }
  ]
}
```

**Notes:**
- Cloud provider models (OpenAI, Anthropic, etc.) are always listed if configured
- Ollama models are dynamically detected from your local instance
- Models must be pulled in Ollama before they appear in the list

### Embeddings

**Endpoint:** `POST /api/v1/embeddings`

**Status:** ⚠️ Stub Implementation - Returns placeholder responses. Full implementation requires OpenAI API key for embedding generation.

**Request Body:**
```json
{
  "model": "text-embedding-3-small",
  "input": "The quick brown fox"
}
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": []  // Currently empty - full implementation pending
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 4,
    "total_tokens": 4
  }
}
```

**Note:** The embeddings endpoint currently returns stub responses. To enable full embeddings support, configure an OpenAI API key and implement the embedding provider integration.

## SDK Compatibility

NodeHub works with any OpenAI-compatible SDK:

**JavaScript/TypeScript:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'nh_your_api_key',
  baseURL: 'http://localhost:3000/api/v1',
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Python:**
```python
from openai import OpenAI

client = OpenAI(
    api_key='nh_your_api_key',
    base_url='http://localhost:3000/api/v1'
)

completion = client.chat.completions.create(
    model='gpt-4o',
    messages=[{'role': 'user', 'content': 'Hello!'}]
)
```

## IDE Integration

### Cursor
Settings → OpenAI API Key → Custom API:
- Base URL: `http://localhost:3000/api/v1`
- API Key: `nh_your_api_key`

### VS Code (Continue.dev)
```json
{
  "models": [{
    "provider": "openai",
    "apiKey": "nh_your_api_key",
    "apiBase": "http://localhost:3000/api/v1"
  }]
}
```

## Error Handling

NodeHub returns appropriate HTTP status codes and detailed error messages:

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| **400** | `invalid_request_error` | Bad request (invalid model, missing parameters) |
| **401** | `authentication_error` | Invalid or missing API key |
| **429** | `rate_limit_error` | Rate limited by upstream provider |
| **500** | `api_error` | Internal server error or upstream provider error |

### Error Response Format

```json
{
  "error": {
    "message": "Detailed error message from provider",
    "type": "error_type"
  }
}
```

### Common Errors

**Authentication Error (401):**
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error"
  }
}
```

**Model Not Supported (400):**
```json
{
  "error": {
    "message": "Model llama3.2:1b not supported",
    "type": "invalid_request_error"
  }
}
```

**Provider Rate Limit (429):**
```json
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing details.",
    "type": "rate_limit_error"
  }
}
```

**Provider Not Configured (400):**
```json
{
  "error": {
    "message": "Provider openai not configured",
    "type": "invalid_request_error"
  }
}
```

### Error Message Details

When a provider returns an error, NodeHub forwards the actual error message from the provider:
- **OpenAI:** Quota exceeded, model not found, etc.
- **Anthropic:** Rate limits, invalid requests, etc.
- **Groq:** Authentication errors, rate limits, etc.
- **Ollama:** Model not found, connection errors, etc.

This helps you diagnose issues directly without checking multiple logs.
