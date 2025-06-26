export interface AIServiceResponse {
  title: string;
  description: string;
}

export interface AIService {
  generateTitleDescription(
    commits: string[],
    repoUrl: string
  ): Promise<AIServiceResponse>;
}
