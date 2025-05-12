// middlewares/logger.middleware.ts

import {getConnInfo} from "hono/bun";
import fs from "node:fs/promises";
import path from "node:path";
import {Context, Next} from "hono";
const logsDir = path.join(process.cwd(), "logs");

// Ensure logs directory exists
fs.mkdir(logsDir, {recursive: true}).catch(() => {});

export const trackRequests = async (c: Context, next: Next) => {
  console.log("trackRequests");
  const requestStartTime = Date.now();
  const requestId = crypto.randomUUID();
  const ipAddress = getConnInfo(c)?.remote?.address || "unknown";
  const method = c.req.method;
  const url = c.req.url;

  console.log({url, method, ipAddress, requestId});

  let requestBody = null;
  try {
    if (["POST", "PUT", "PATCH"].includes(method)) {
      requestBody = await c.req.json().catch(() => null);
      console.log({requestBody});
    }
  } catch (error) {
    console.error("Error reading request body:", error);
  }

  await next();

  const requestDuration = Date.now() - requestStartTime;
  const responseStatus = c.res.status;
  let responseBody = null;

  try {
    const clonedRes = c.res.clone();
    responseBody = await clonedRes.json().catch(() => null);
  } catch (error) {
    console.error("Error reading response body:", error);
  }

  const logEntry = {
    requestId,
    timestamp: new Date().toISOString(),
    ipAddress,
    method,
    url,
    requestBody,
    responseStatus,
    responseBody,
    duration: requestDuration,
  };

  const logFileName = `${new Date().toISOString().split("T")[0]}.json`;
  const logFilePath = path.join(logsDir, logFileName);

  try {
    let logs = [];
    try {
      const existingData = await fs.readFile(logFilePath, "utf-8");
      logs = JSON.parse(existingData);
    } catch (_) {}
    logs.push(logEntry);
    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to log file:", error);
  }

  return c.res;
};
