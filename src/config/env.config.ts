// src/env.config.ts (or just env.config.ts if flat)
export const env = {
  JWT_SECRET: Bun.env.JWT_SECRET || "secret",
  PORT: parseInt(Bun.env.PORT || "7000", 10),
  NODE_ENV: Bun.env.NODE_ENV || "development",
  CLAUDE_API_KEY: Bun.env.CLAUDE_API_KEY || "",
  CLAUDE_API_URL:
    Bun.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages",
  MICROSOFT_API_KEY: Bun.env.MICROSOFT_API_KEY || "",
  MONGO_URI: Bun.env.MONGO_URI || "",
};
