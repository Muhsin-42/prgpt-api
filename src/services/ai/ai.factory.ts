// services/ai/ai.factory.ts
import {AIService} from "./ai.interface";
import {ClaudeAIService} from "./claude.service";
import {OpenAIService} from "./openai.service";
import {GeminiAIService} from "./gemini.service";
import {OpenRouterAIService} from "./openrouter.service";
import {MistralAIService} from "./mistral.service";

export enum AIServiceType {
  CLAUDE = "claude",
  OPENAI = "openai",
  GEMINI = "gemini",
  OPENROUTER = "openrouter",
  MISTRAL = "mistral",
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
          config.model || "deepseek/deepseek-r1-0528-qwen3-8b:free",
          config.apiUrl,
          config.siteUrl,
          config.siteName
        );
      case AIServiceType.MISTRAL:
        return new MistralAIService(config.apiKey, config.apiUrl, config.model);
      default:
        throw new Error(`Unsupported AI service type: ${type}`);
    }
  }
}
