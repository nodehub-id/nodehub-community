import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig } from './base';

export class OllamaProvider extends BaseProvider {
  async *chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse> {
    const response = await fetch(`${this.config.baseUrl || 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: request.stream,
        options: {
          temperature: request.temperature,
          num_predict: request.max_tokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    if (request.stream) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let messageId = `ollama-${Date.now()}`;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);
            if (chunk.message) {
              yield {
                id: messageId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: request.model,
                choices: [{
                  index: 0,
                  message: chunk.message,
                  finish_reason: chunk.done ? 'stop' : null,
                }],
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
              };
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } else {
      const data = await response.json();
      yield {
        id: `ollama-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: data.message,
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl || 'http://localhost:11434'}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  calculateCost(): number {
    // Ollama is free (local)
    return 0;
  }
}
