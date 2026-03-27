import { Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { LlmService } from './llm.service';
import { LLM_PROVIDER } from './llm-provider.interface';

@Module({
  providers: [
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
    LlmService,
  ],
  exports: [LlmService, LLM_PROVIDER],
})
export class LlmModule {}
