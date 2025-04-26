import {AIService, AIServiceResponse} from "./ai.interface";
import axios from "axios";

export class ClaudeAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor(
    apiKey: string,
    apiUrl: string = "https://api.anthropic.com/v1/messages"
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async generateTitleDescription(
    commits: string[]
  ): Promise<AIServiceResponse> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [
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
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        }
      );

      // Extract response from Claude
      const content = response.data.content[0].text;
      console.log(
        "🚀 ~ file: claude.service.ts:generateTitleDescription ~ content:",
        content
      );
      return content;
      // Try to parse the JSON response
      try {
        // This handles if Claude returns a properly formatted JSON
        const parsedResponse = JSON.parse(content);
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
        };
      } catch (error) {
        // If Claude doesn't return valid JSON, try to extract title and description manually
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
      console.log("eeeee", error);
      //   console.error("Error calling Claude API:", error);
      //   throw new Error(
      //     `Failed to generate title and description: ${(error as Error).message}`
      //   );
    }
  }
}
