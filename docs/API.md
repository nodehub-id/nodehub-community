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
    }
  ]
}
```

### Embeddings

**Endpoint:** `POST /api/v1/embeddings`

**Request Body:**
```json
{
  "model": "text-embedding-3-small",
  "input": "The quick brown fox"
}
```

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

**401 Unauthorized:** Invalid or missing API key
**429 Rate Limited:** Too many requests
**500 Server Error:** Internal server error

Error response format:
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "authentication_error"
  }
}
```
