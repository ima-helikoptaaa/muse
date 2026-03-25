import {
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from '@muse/shared';

export const LLM_PROVIDER = 'LLM_PROVIDER';

export interface ILLMProvider {
  readonly providerName: string;
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResult>;
  completeJSON<T>(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<T>;
}
