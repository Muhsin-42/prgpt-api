import {AIService, AIServiceResponse} from "./ai.interface";
import axios from "axios";

export class GeminiAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor(
    apiKey: string,
    apiUrl: string = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async generateTitleDescription(
    commits: string[]
  ): Promise<AIServiceResponse> {
    try {
      // Build the API URL with the API key as a query parameter
      const urlWithApiKey = `${this.apiUrl}?key=${this.apiKey}`;

      const response = await axios.post(
        urlWithApiKey,
        {
          contents: [
            {
              parts: [
                {
                  text: `Given these git commit messages: ${JSON.stringify(
                    commits
                  )}, 
                  generate a concise and descriptive PR title and a markdown-formatted PR description 
                  that summarizes the changes. Focus on the main features or fixes.

                  Example:
                  commits: [
                    "migration to next 15 : params unwrapping, tiptap editor for text editing",
                    "status based case listing page",
                    "status listing along with case count in sidebar",
                    "case details page"
                  ]
                  
                  {
                    "title": "This PR includes the migration of the project to **Next.js 15**, along with several feature enhancements and structural improvements to the case management system.",
                    "description": "## 🧩 Summary

This PR includes the migration of the project to **Next.js 15**, along with several feature enhancements and structural improvements to the case management system.

---

## ✨ What’s Included?

### 🔄 Migration to Next.js 15
- Updated the project to use **Next.js 15**.
- Implemented the new **route segment config** for better flexibility.
- Refactored dynamic routes to **unwrap params properly** as per Next.js 15 conventions.

### ✍️ Tiptap Editor Integration
- Integrated **Tiptap** as the rich text editor for case-related text editing.
- Supports rich formatting, inline links, and better user experience.

### 📂 Status-Based Case Listing
- Implemented a **status-filtered case listing** page.
- Users can now view cases categorized by status (e.g., Pending, Approved, Rejected).

### 📊 Status Overview in Sidebar
- Added **status summary in sidebar**.
- Displays a count of cases under each status for quick navigation.

### 🔍 Case Details Page
- Built out a **dedicated case details page** with comprehensive info and editable content using Tiptap.

"
                  }

                  Note: the description must be strictly markdown-formatted and beautiful.
                  
                  Return the response in JSON format with two fields: 'title' (a short string) and 'description' (a Markdown-formatted string with no escaped characters or unnecessary backslashes — renderable directly in a UI).`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.95,
            topK: 40,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Extract response from Gemini
      const content = response.data.candidates[0].content.parts[0].text;

      // Try to parse the JSON response
      try {
        // This handles if Gemini returns a properly formatted JSON
        const parsedResponse = JSON.parse(content);
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
        };
      } catch (error) {
        // If Gemini doesn't return valid JSON, try to extract title and description manually
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
      console.error("Error calling Gemini API:", error);
      throw new Error(
        `Failed to generate title and description: ${(error as Error).message}`
      );
    }
  }
}
