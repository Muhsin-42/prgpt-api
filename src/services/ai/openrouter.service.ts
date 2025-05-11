// services/ai/openrouter.service.ts
import {AIService, AIServiceResponse} from "./ai.interface";
import axios from "axios";

export class OpenRouterAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private siteUrl: string;
  private siteName: string;

  constructor(
    apiKey: string,
    model: string = "microsoft/mai-ds-r1:free",
    apiUrl: string = "https://openrouter.ai/api/v1/chat/completions",
    siteUrl: string = "",
    siteName: string = ""
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
    this.siteUrl = siteUrl;
    this.siteName = siteName;
  }

  async generateTitleDescription(
    commits: string[]
  ): Promise<AIServiceResponse> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      };

      // Add optional headers if provided
      if (this.siteUrl) {
        headers["HTTP-Referer"] = this.siteUrl;
      }

      if (this.siteName) {
        headers["X-Title"] = this.siteName;
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates concise and descriptive PR titles and descriptions.",
            },
            {
              role: "user",
              content: `Given these git commit messages: ${JSON.stringify(
                commits
              )}, 
              generate a concise and descriptive PR title and a markdown-formatted PR description 
              that summarizes the changes. Focus on the main features or fixes.
              
              Return the response in JSON format with "title" and "description" fields.
              also add emojis to the title and description as needed and relevant.
              `,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {headers}
      );

      // Extract response from OpenRouter
      const content = response.data.choices[0].message.content;

      // Try to parse the JSON response
      try {
        // This handles if the model returns a properly formatted JSON
        const parsedResponse = JSON.parse(content);
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
        };
      } catch (error) {
        // If the model doesn't return valid JSON, try to extract title and description manually
        const titleMatch = content.match(/title["\s:]+([^\n"]+)/i);
        const descriptionMatch = content.match(
          /description["\s:]+(.+?)(?=\n\n|$)/i
        );

        return {
          title: titleMatch ? titleMatch[1].trim() : "Feature Update",
          description: descriptionMatch ? descriptionMatch[1].trim() : content,
        };
      }
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);
      throw new Error(
        `Failed to generate title and description: ${(error as Error).message}`
      );
    }
  }
}
