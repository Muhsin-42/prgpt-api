// services/ai/ai.factory.ts
import {AIService} from "./ai.interface";
import {ClaudeAIService} from "./claude.service";
import {OpenAIService} from "./openai.service";
import {GeminiAIService} from "./gemini.service";
import {OpenRouterAIService} from "./openrouter.service";

export enum AIServiceType {
  CLAUDE = "claude",
  OPENAI = "openai",
  GEMINI = "gemini",
  OPENROUTER = "openrouter",
}

export class AIServiceFactory {
  static createService(type: AIServiceType, config: any): AIService {
    switch (type) {
      case AIServiceType.CLAUDE:
        return new ClaudeAIService(config.apiKey, config.apiUrl);
      case AIServiceType.OPENAI:
        return new OpenAIService(config.apiKey, config.apiUrl);
      case AIServiceType.GEMINI:
        return new GeminiAIService(config.apiKey, config.apiUrl);
      case AIServiceType.OPENROUTER:
        return new OpenRouterAIService(
          config.apiKey,
          config.model || "microsoft/mai-ds-r1:free",
          config.apiUrl,
          config.siteUrl,
          config.siteName
        );
      default:
        throw new Error(`Unsupported AI service type: ${type}`);
    }
  }
}
