import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER } from './llm-provider.interface';
import { ClaudeProvider, OpenAIProvider, GeminiProvider } from './providers';
import { LlmService } from './llm.service';

@Module({
  providers: [
    ClaudeProvider,
    OpenAIProvider,
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useFactory: (
        config: ConfigService,
        claude: ClaudeProvider,
        openai: OpenAIProvider,
        gemini: GeminiProvider,
      ) => {
        const provider = config.get<string>('llm.provider', 'claude');
        switch (provider) {
          case 'claude':
            return claude;
          case 'openai':
            return openai;
          case 'gemini':
            return gemini;
          default:
            throw new Error(`Unknown LLM provider: ${provider}`);
        }
      },
      inject: [ConfigService, ClaudeProvider, OpenAIProvider, GeminiProvider],
    },
    LlmService,
  ],
  exports: [LlmService, LLM_PROVIDER],
})
export class LlmModule {}
