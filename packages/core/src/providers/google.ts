import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig } from './base';

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
            parts: [{ text: m.content }],
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
    const data = await response.json();
    
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

  getModels(): string[] {
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
