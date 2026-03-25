import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider } from '../llm-provider.interface';
import {
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from '@muse/shared';

@Injectable()
export class ClaudeProvider implements ILLMProvider {
  readonly providerName = 'claude';
  private client: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('llm.anthropicApiKey');
    this.client = new Anthropic({ apiKey });
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResult> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((c) => c.type === 'text');

    return {
      content: textBlock?.text || '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      provider: this.providerName,
      model: response.model,
    };
  }

  async completeJSON<T>(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<T> {
    const result = await this.complete(messages, {
      ...options,
      temperature: options?.temperature ?? 0.3,
    });

    const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : result.content;

    return JSON.parse(jsonStr.trim());
  }
}
