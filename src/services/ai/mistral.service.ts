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

  // async generateTitleDescription(
  //   commits: string[],
  //   repoUrl: string
  // ): Promise<AIServiceResponse> {
  //   console.log("repoUrl", repoUrl);
  //   const baseBranch = repoUrl.split("...")[0].split("/").pop();
  //   const headBranch = repoUrl.split("...")[1].split("/").pop();
  //   const repo = repoUrl.split("...")[0].split("/").pop();
  //   console.log({repo, baseBranch, headBranch});

  //   try {
  //     const response = await axios.post(
  //       this.apiUrl,
  //       {
  //         model: this.model,
  //         messages: [
  //           {
  //             role: "system",
  //             content: `You are a senior software engineer creating professional pull request descriptions.
  //             Always respond with ONLY a JSON object in this exact format:
  //             {
  //               "title": "Conventional Commits-style title (max 72 chars)",
  //               "description": "## Description\\nConcise overview of changes\\n\\n## Changes\\n- Bullet points of specific changes\\n- Reference issues/tickets when possible\\n- Group related changes\\n\\n## Impact\\nWhat areas/components are affected\\n\\n## Notes\\nAny additional context"
  //             }

  //             Guidelines:
  //             1. Title: Use Conventional Commits format (feat, fix, chore, docs, style, refactor, perf, test)
  //             2. Description: Be specific about technical changes
  //             3. Mention specific files/modules when relevant
  //             4. Keep language professional and concise`,
  //           },
  //           {
  //             role: "user",
  //             content: `Generate a professional PR for these commits:\n\n${commits.join(
  //               "\n"
  //             )}\n\nAdditional context:
  //             - Repository: ${repo}
  //             - Base Branch: ${baseBranch}
  //             - Head Branch: ${headBranch}

  //             Please analyze the commit messages and:
  //             1. Categorize the changes (feature, bugfix, etc.)
  //             2. Identify technical specifics
  //             3. Note any breaking changes
  //             4. Group related changes logically`,
  //           },
  //         ],
  //         temperature: 0.3, // Lower for more focused results
  //         response_format: {type: "json_object"},
  //         max_tokens: 1200,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${this.apiKey}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     const content = response.data.choices[0].message.content;

  //     // Robust parsing with multiple fallbacks
  //     const parseResponse = (content: string): AIServiceResponse => {
  //       // Try direct JSON parse first
  //       try {
  //         const parsed = JSON.parse(content);
  //         if (parsed.title && parsed.description) {
  //           return parsed;
  //         }
  //       } catch {}

  //       // Try extracting from potential code block
  //       const jsonMatch = content.match(/(\{[\s\S]*\})/);
  //       if (jsonMatch) {
  //         try {
  //           const parsed = JSON.parse(jsonMatch[1]);
  //           if (parsed.title && parsed.description) {
  //             return parsed;
  //           }
  //         } catch {}
  //       }

  //       // Final fallback - extract title and description by pattern
  //       return {
  //         title:
  //           content.split("\n")[0]?.replace(/^["']|["']$/g, "") ||
  //           "Feature Update",
  //         description: content.includes("\n")
  //           ? content.split("\n").slice(1).join("\n").trim()
  //           : content,
  //       };
  //     };

  //     return parseResponse(content);
  //   } catch (error) {
  //     console.error("Error calling Mistral API:", error);
  //     return {
  //       title: "Feature Update",
  //       description: `This PR includes:\n${commits
  //         .map((c) => `- ${c}`)
  //         .join("\n")}`,
  //     };
  //   }
  // }

  async generateTitleDescription(
    commits: string[],
    repoUrl: string
  ): Promise<AIServiceResponse> {
    // Set default response for quick fallback
    const defaultResponse: AIServiceResponse = {
      title: "Feature Update",
      description: `Changes:\n${commits.map((c) => `- ${c}`).join("\n")}`,
    };

    // Early return if no commits
    if (!commits.length) return defaultResponse;

    try {
      // Extract branch info (non-blocking)
      const [baseBranch, headBranch] = repoUrl
        .split("...")
        .map((part) => part.split("/").pop() || "");

      // Optimized API call with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: `Respond ONLY with JSON: {"title":"PR title","description":"Markdown description"}`,
            },
            {
              role: "user",
              content: `Create PR for ${headBranch}→${baseBranch}. Commits:\n${commits
                .slice(0, 10)
                .join("\n")}${
                commits.length > 10
                  ? "\n...and " + (commits.length - 10) + " more"
                  : ""
              }`,
            },
          ],
          temperature: 0.3,
          response_format: {type: "json_object"},
          max_tokens: 600, // Reduced from 1200
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      // Fast path parsing
      try {
        const content = response.data.choices[0]?.message?.content;
        if (typeof content === "string") {
          const result = JSON.parse(content);
          if (result.title && result.description) {
            return {
              title: result.title,
              description: result.description.replace(/\\n/g, "\n"),
            };
          }
        }
      } catch (e) {
        console.warn("Fast parse failed, using default");
      }

      return defaultResponse;
    } catch (error: any) {
      console.error("API call failed:", error?.response?.data?.message);
      return defaultResponse;
    }
  }
}
