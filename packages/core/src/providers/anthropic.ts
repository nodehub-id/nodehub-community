import { BaseProvider, ChatCompletionRequest, ChatCompletionResponse, ProviderConfig } from './base';

export class AnthropicProvider extends BaseProvider {
  async *chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse> {
    // Convert messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        system: systemMessage?.content,
        temperature: request.temperature,
        max_tokens: request.max_tokens || 4096,
        stream: request.stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
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
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield {
                id: event.message?.id || `anthropic-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: request.model,
                choices: [{
                  index: 0,
                  message: { role: 'assistant', content: event.delta.text },
                  finish_reason: event.type === 'message_stop' ? 'stop' : null,
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
        id: data.id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.content?.[0]?.text || '',
          },
          finish_reason: data.stop_reason || 'stop',
        }],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    }
  }

  getModels(): string[] {
    return ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'];
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'claude-3-5-sonnet-latest': { prompt: 3 / 1000000, completion: 15 / 1000000 },
      'claude-3-opus-latest': { prompt: 15 / 1000000, completion: 75 / 1000000 },
      'claude-3-haiku-latest': { prompt: 0.25 / 1000000, completion: 1.25 / 1000000 },
    };

    const cost = costs[model] || costs['claude-3-5-sonnet-latest'];
    return (promptTokens * cost.prompt) + (completionTokens * cost.completion);
  }
}
