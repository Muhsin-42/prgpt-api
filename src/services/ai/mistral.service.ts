import {AIService, AIServiceResponse} from "./ai.interface";
import axios from "axios";

export class MistralAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor(
    apiKey: string,
    apiUrl: string = "https://api.mistral.ai/v1/chat/completions",
    model: string = "mistral-small-latest"
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
  }

  async generateTitleDescription(
    commits: string[]
  ): Promise<AIServiceResponse> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates concise and descriptive PR titles and descriptions based on git commit messages.",
            },
            {
              role: "user",
              content: `Given these git commit messages: ${JSON.stringify(
                commits
              )}, 
              generate a concise and descriptive PR title and a markdown-formatted PR description 
              that summarizes the changes. Focus on the main features or fixes.
              
              Return the response in JSON format with "title" and "description" fields.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Extract response from Mistral
      const content = response.data.choices[0].message.content;
      console.log(
        "🚀 ~ file: mistral.service.ts:generateTitleDescription ~ content:",
        content
      );

      // Try to parse the JSON response
      try {
        // This handles if Mistral returns a properly formatted JSON
        const parsedResponse = JSON.parse(content);
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
        };
      } catch (error) {
        // If Mistral doesn't return valid JSON, try to extract title and description manually
        const titleMatch = content.match(/title["\s:]+([^\n"]+)/i);
        const descriptionMatch = content.match(
          /description["\s:]+([\s\S]+?)(?=\n\n|$)/i
        );

        return {
          title: titleMatch ? titleMatch[1].trim() : "Feature Update",
          description: descriptionMatch ? descriptionMatch[1].trim() : content,
        };
      }
    } catch (error) {
      console.error("Error calling Mistral API:", error);
      throw new Error(
        `Failed to generate title and description: ${(error as Error).message}`
      );
    }
  }
}
