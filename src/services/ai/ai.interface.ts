export interface AIServiceResponse {
  title: string;
  description: string;
}

export interface AIService {
  generateTitleDescription(commits: string[]): Promise<AIServiceResponse>;
}
