import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig } from './base';

export class OpenAIProvider extends BaseProvider {
  async *chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
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
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'gpt-4o': { prompt: 2.5 / 1000000, completion: 10 / 1000000 },
      'gpt-4o-mini': { prompt: 0.15 / 1000000, completion: 0.6 / 1000000 },
      'gpt-4': { prompt: 30 / 1000000, completion: 60 / 1000000 },
      'gpt-3.5-turbo': { prompt: 0.5 / 1000000, completion: 1.5 / 1000000 },
    };

    const cost = costs[model] || costs['gpt-4o'];
    return (promptTokens * cost.prompt) + (completionTokens * cost.completion);
  }
}

export function createOpenAIProvider(config: ProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
