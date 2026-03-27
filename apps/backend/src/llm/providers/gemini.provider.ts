import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';
import { ILLMProvider } from '../llm-provider.interface';
import {
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from '@muse/shared';

@Injectable()
export class GeminiProvider implements ILLMProvider {
  readonly providerName = 'gemini';
  private vertexAI: VertexAI;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private configService: ConfigService) {
    const credentialsPath = this.configService.get<string>(
      'llm.googleCredentialsPath',
    );
    const projectId = this.configService.get<string>('llm.googleProjectId');
    const location = this.configService.get<string>('llm.googleLocation') || 'global';

    if (credentialsPath) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    }

    this.vertexAI = new VertexAI({
      project: projectId || '',
      location,
      ...(location === 'global'
        ? { apiEndpoint: 'aiplatform.googleapis.com' }
        : {}),
    });

    this.logger.log(
      `Gemini provider initialized (project: ${projectId}, location: ${location})`,
    );
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResult> {
    const model = this.vertexAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens || 4096,
      },
    });

    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const history = nonSystemMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

    const chat = model.startChat({
      history,
      ...(systemMessage
        ? { systemInstruction: { role: 'user' as const, parts: [{ text: systemMessage.content }] } }
        : {}),
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content: text,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
      provider: this.providerName,
      model: 'gemini-3.1-flash-lite-preview',
    };
  }

  async completeJSON<T>(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<T> {
    const result = await this.complete(messages, {
      ...options,
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens || 8192,
    });

    if (!result.content || !result.content.trim()) {
      throw new Error(
        `Gemini returned empty response (usage: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out)`,
      );
    }

    const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : result.content;

    try {
      return JSON.parse(jsonStr.trim());
    } catch (e) {
      this.logger.error(
        `Failed to parse Gemini JSON response (${jsonStr.length} chars): ${jsonStr.slice(0, 200)}...`,
      );
      throw new Error(`Gemini returned invalid JSON: ${(e as Error).message}`);
    }
  }
}
