import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILLMProvider } from '../llm-provider.interface';
import {
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from '@muse/shared';

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  readonly providerName = 'openai';
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('llm.openaiApiKey');
    this.client = new OpenAI({ apiKey });
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...(options?.responseFormat === 'json'
        ? { response_format: { type: 'json_object' } }
        : {}),
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
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
      responseFormat: 'json',
      temperature: options?.temperature ?? 0.3,
    });
    return JSON.parse(result.content);
  }
}
