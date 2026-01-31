import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig } from './base';

export class GroqProvider extends BaseProvider {
  async *chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.groq.com/openai'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorBody);
        errorMessage = errorData.error?.message || errorData.message || response.statusText;
      } catch {
        errorMessage = errorBody || response.statusText;
      }
      const error = new Error(errorMessage) as Error & { statusCode: number };
      error.statusCode = response.status;
      throw error;
    }

    if (request.stream) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;

          try {
            const chunk = JSON.parse(data);
            yield chunk;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } else {
      const data = await response.json() as ChatCompletionResponse;
      yield data;
    }
  }

  async getModels(): Promise<string[]> {
    return ['llama-3.2-70b', 'mixtral-8x7b'];
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'llama-3.2-70b': { prompt: 0.9 / 1000000, completion: 0.9 / 1000000 },
      'mixtral-8x7b': { prompt: 0.27 / 1000000, completion: 0.27 / 1000000 },
    };

    const cost = costs[model] || costs['llama-3.2-70b'];
    return (promptTokens * cost.prompt) + (completionTokens * cost.completion);
  }
}
