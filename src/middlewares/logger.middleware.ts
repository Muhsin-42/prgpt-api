import {getConnInfo} from "hono/bun";
import {logRequest} from "../services/db/logging.service";
import {Context, Next} from "hono";

export const trackRequests = async (c: Context, next: Next) => {
  if (c.req.method === "GET") {
    return next();
  }
  const requestStartTime = Date.now();
  const requestId = crypto.randomUUID();

  const forwardedFor = c.req.header("x-forwarded-for");
  const realIp =
    forwardedFor?.split(",")[0]?.trim() ||
    getConnInfo(c)?.remote?.address ||
    "unknown";

  const ipAddress = realIp;
  const method = c.req.method;
  const url = c.req.url;

  let currentUrl = null;
  let requestBody = null;
  let username = null;

  try {
    if (["POST", "PUT", "PATCH"].includes(method)) {
      const body = await c.req.json().catch(() => null);
      requestBody = body;
      currentUrl = body?.currentUrl ?? null;
      username = body?.username ?? null;
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
    timestamp: new Date(),
    ipAddress,
    method,
    url,
    currentUrl,
    username,
    requestBody,
    responseStatus,
    responseBody,
    duration: requestDuration,
  };

  logRequest(logEntry).catch((err) => {
    console.error("Logging error:", err);
  });

  return c.res;
};
