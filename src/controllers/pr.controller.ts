import {Context} from "hono";
import {AIServiceFactory, AIServiceType} from "../services/ai";
import {RequestLog} from "../models/request-logs.model";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MICROSOFT_API_KEY = process.env.MICROSOFT_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SITE_URL = process.env.SITE_URL || "";
const SITE_NAME = process.env.SITE_NAME || "";

const AI_SERVICE_TYPE =
  (process.env.AI_SERVICE_TYPE as AIServiceType) || AIServiceType.OPENROUTER;

let aiService;

switch (AI_SERVICE_TYPE) {
  case AIServiceType.CLAUDE:
    aiService = AIServiceFactory.createService(AIServiceType.CLAUDE, {
      apiKey: CLAUDE_API_KEY,
    });
    break;
  case AIServiceType.OPENAI:
    aiService = AIServiceFactory.createService(AIServiceType.OPENAI, {
      apiKey: OPENAI_API_KEY,
    });
    break;
  case AIServiceType.GEMINI:
    aiService = AIServiceFactory.createService(AIServiceType.GEMINI, {
      apiKey: GEMINI_API_KEY,
    });
    break;
  case AIServiceType.OPENROUTER:
    aiService = AIServiceFactory.createService(AIServiceType.OPENROUTER, {
      apiKey: OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "microsoft/mai-ds-r1:free",
      siteUrl: SITE_URL,
      siteName: SITE_NAME,
    });
    break;
  default:
    aiService = AIServiceFactory.createService(AIServiceType.CLAUDE, {
      apiKey: CLAUDE_API_KEY,
    });
}
export const generateTitleDescription = async (c: Context) => {
  try {
    const {commits} = await c.req.json();

    if (!commits || !Array.isArray(commits) || commits.length === 0) {
      return c.json({message: "No valid commits found"}, 400);
    }

    const result = await aiService.generateTitleDescription(commits);

    return c.json(
      {
        message: "Title and Description generated successfully.",
        data: result,
        provider: AI_SERVICE_TYPE,
      },
      201
    );
  } catch (error) {
    console.error("Error generating title and description:", error);
    return c.json(
      {
        message: "Failed to generate title and description",
        error: (error as Error).message,
      },
      500
    );
  }
};

interface Stats {
  totalPrGenerated: number;
  totalUniqueUsers: number;
  totalUniqueIps: number;
  totalUniqueRepositories: number;
  uniqueUsersList: string[];
  uniqueIpsList: string[];
  uniqueRepositoriesList: string[];
}

export const getStats = async (c: Context) => {
  try {
    // stats include
    // 1. total pr generated. (check if the responseBody exist if it exist count as one)
    // 2. total unique users by username, a. give total count b. give list of users
    // 3. total unique ips
    // 4. total unique repositories a. give total count b. give list of repositories (currentUrl)

    const stats: Stats = {
      totalPrGenerated: 0,
      totalUniqueUsers: 0,
      totalUniqueIps: 0,
      totalUniqueRepositories: 0,
      uniqueUsersList: [],
      uniqueIpsList: [],
      uniqueRepositoriesList: [],
    };

    const totalPrGenerated = await RequestLog.countDocuments({
      responseBody: {$exists: true},
    });
    stats.totalPrGenerated = totalPrGenerated;

    const totalUniqueUsers = await RequestLog.countDocuments({
      username: {$exists: true},
    });
    stats.totalUniqueUsers = totalUniqueUsers;

    const totalUniqueIps = await RequestLog.countDocuments({
      ipAddress: {$exists: true},
    });
    stats.totalUniqueIps = totalUniqueIps;

    const uniqueUsersList = await RequestLog.distinct("username");
    stats.uniqueUsersList = uniqueUsersList.filter((user) => user !== null);

    const uniqueIpsList = await RequestLog.distinct("ipAddress");
    stats.uniqueIpsList = uniqueIpsList.filter((ip) => ip !== null);

    const uniqueUrls = await RequestLog.distinct("currentUrl");

    const repoNames = new Set();

    for (const url of uniqueUrls) {
      const match = url?.match(/github\.com\/[^\/]+\/([^\/]+)/);
      if (match && match[1]) {
        repoNames.add(match[1]);
      }
    }

    const uniqueRepoNames = Array.from(repoNames) as string[];
    stats.uniqueRepositoriesList = uniqueRepoNames;
    stats.totalUniqueRepositories = uniqueRepoNames.length;
    return c.json(stats, 200);
  } catch (error) {
    console.error("Error getting stats:", error);
    return c.json({message: "Failed to get stats"}, 500);
  }
};
