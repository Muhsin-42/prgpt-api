import {AIService, AIServiceResponse} from "./ai.interface";
import axios from "axios";

export class OpenAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor(
    apiKey: string,
    apiUrl: string = "https://api.openai.com/v1/chat/completions"
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
          model: "gpt-3.5-turbo",
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
              
              Return the response in JSON format with "title" and "description" fields.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Extract response from OpenAI
      const content = response.data.choices[0].message.content;

      // Try to parse the JSON response
      try {
        // This handles if OpenAI returns a properly formatted JSON
        const parsedResponse = JSON.parse(content);
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
        };
      } catch (error) {
        // If OpenAI doesn't return valid JSON, try to extract title and description manually
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
      console.error("Error calling OpenAI API:", error);
      throw new Error(
        `Failed to generate title and description: ${(error as Error).message}`
      );
    }
  }
}
