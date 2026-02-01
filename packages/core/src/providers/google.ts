import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig, ContentPart } from './base';

// Gemini content types
type GeminiTextPart = { text: string };
type GeminiInlineDataPart = { inline_data: { mime_type: string; data: string } };
type GeminiFileDataPart = { file_data: { file_uri: string } };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart | GeminiFileDataPart;

/**
 * Convert OpenAI content format to Gemini content format
 * OpenAI: { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
 * Gemini: { inline_data: { mime_type: 'image/png', data: '...' } }
 */
function convertContentForGemini(content: string | ContentPart[]): GeminiPart[] {
  if (typeof content === 'string') {
    return [{ text: content }];
  }

  return content.map(part => {
    if (part.type === 'text') {
      return { text: part.text };
    }
    // Convert image_url to Gemini's format
    const url = part.image_url.url;
    if (url.startsWith('data:')) {
      // Parse base64 data URI: data:image/png;base64,iVBORw0KGgo...
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const [, mimeType, data] = matches;
        return { inline_data: { mime_type: mimeType, data } };
      }
    }
    // For HTTP URLs, use file_data format
    return { file_data: { file_uri: url } };
  });
}

export class GoogleProvider extends BaseProvider {
  async *chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse> {
    const response = await fetch(
      `${this.config.baseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${request.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: convertContentForGemini(m.content),
          })),
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.max_tokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    // Note: Gemini currently doesn't support streaming in the same way
    const data = await response.json() as {
      name?: string;
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    yield {
      id: data.name || `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        },
        finish_reason: data.candidates?.[0]?.finishReason || 'stop',
      }],
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async getModels(): Promise<string[]> {
    return ['gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'gemini-1.5-pro': { prompt: 3.5 / 1000000, completion: 10.5 / 1000000 },
      'gemini-1.5-flash': { prompt: 0.35 / 1000000, completion: 1.05 / 1000000 },
    };

    const cost = costs[model] || costs['gemini-1.5-pro'];
    return (promptTokens * cost.prompt) + (completionTokens * cost.completion);
  }
}
