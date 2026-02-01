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

### Vision Support (Images)

NodeHub supports images in chat messages for vision-capable models. Use the multimodal content format:

**Request with Image (base64):**
```json
{
  "model": "gpt-4o",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "What is in this image?"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgo..."}}
    ]
  }]
}
```

**Request with Image (URL):**
```json
{
  "model": "claude-3-5-sonnet-latest",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "Describe this image"},
      {"type": "image_url", "image_url": {"url": "https://example.com/image.png"}}
    ]
  }]
}
```

**Image Content Format:**
```typescript
// Message content can be string or array of content parts
content: string | ContentPart[]

// Content part types
interface TextContentPart {
  type: 'text';
  text: string;
}

interface ImageContentPart {
  type: 'image_url';
  image_url: {
    url: string;              // base64 data URI or HTTP URL
    detail?: 'auto' | 'low' | 'high';  // optional quality hint
  };
}
```

**Vision-Capable Models:**

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4o`, `gpt-4o-mini` |
| Anthropic | `claude-3-5-sonnet-latest`, `claude-3-opus-latest`, `claude-3-haiku-latest` |
| Google | `gemini-1.5-pro`, `gemini-1.5-flash` |

**Supported Image Formats:**
- Base64 data URI: `data:image/png;base64,...` or `data:image/jpeg;base64,...`
- HTTP URLs: `https://example.com/image.png`

**Caching:** Vision requests are cached by including the full image content in the query hash.

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

**Status:** ⚠️ Stub Implementation - Returns placeholder responses for API compatibility. Full embedding generation is used internally for semantic caching but the API endpoint returns empty arrays to maintain OpenAI compatibility.

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
      "embedding": []  // Empty array - endpoint returns stub for compatibility
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 4,
    "total_tokens": 4
  }
}
```

**Note:** The embeddings API endpoint returns stub responses for compatibility with OpenAI SDKs. However, **semantic caching is fully functional** using local embeddings (Xenova/all-MiniLM-L6-v2) without requiring any API keys. The internal embedding system powers the semantic cache but is not exposed through this API endpoint yet.

## Caching

NodeHub automatically caches responses to reduce API costs and improve response times.

### Two-Layer Caching System

1. **Exact Match** - SHA-256 hash lookup (~5ms)
   - Identical queries return cached responses instantly
2. **Semantic Match** - Cosine similarity search (~50ms)
   - Similar queries (similarity >= 0.95) return cached responses
   - Uses local embeddings via @xenova/transformers (Xenova/all-MiniLM-L6-v2)
   - **No API key required** for semantic caching

### Cache Response Fields

All chat completion responses include a `nodehub` object with caching information:

**Cache Miss (new request):**
```json
{
  "nodehub": {
    "cache_hit": false
  }
}
```

**Exact Match (identical query):**
```json
{
  "nodehub": {
    "cache_hit": true,
    "cache_type": "exact",
    "similarity": 1.0
  }
}
```

**Semantic Match (similar query):**
```json
{
  "nodehub": {
    "cache_hit": true,
    "cache_type": "semantic",
    "similarity": 0.97
  }
}
```

### Cache Statistics

When a cache hit occurs:
- `usage` fields show 0 tokens (no API call made)
- Response time is significantly faster (~5-50ms vs 500-2000ms)
- Cost is $0 (no provider API call)

### TTL

Cache entries expire after 24 hours by default.

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
| **400** | `invalid_request_error` | Bad request (invalid model, missing parameters, provider not configured) |
| **401** | `authentication_error` | Invalid or missing API key |
| **404** | `not_found_error` | Resource not found (e.g., user session invalid) |
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

**User Not Found (404):**
```json
{
  "error": {
    "message": "User not found. Please sign out and sign back in.",
    "type": "not_found_error"
  }
}
```

**Note:** This error occurs when your session references a user that no longer exists in the database (e.g., after database reset). Sign out and sign back in to recreate your user session.

### Error Message Details

When a provider returns an error, NodeHub forwards the actual error message from the provider:
- **OpenAI:** Quota exceeded, model not found, etc.
- **Anthropic:** Rate limits, invalid requests, etc.
- **Groq:** Authentication errors, rate limits, etc.
- **Ollama:** Model not found, connection errors, etc.

This helps you diagnose issues directly without checking multiple logs.
