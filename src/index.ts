import {Hono} from "hono";
import {logger} from "hono/logger";
import {getConnInfo} from "hono/bun";
import {poweredBy} from "hono/powered-by";
import {env} from "./config/env.config";
import {cors} from "hono/cors";
import {prRoutes} from "./routes/pr.routes";
import {rateLimiter} from "hono-rate-limiter";
import {trackRequests} from "./middlewares/logger.middleware";
import mongoose from "mongoose";
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", poweredBy());
app.use("*", cors());
app.use("*", trackRequests);

mongoose
  .connect(env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB connected"))
  .catch((err) => console.error("🔴 MongoDB connection error:", err));

const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  keyGenerator: (c) => {
    const forwardedFor = c.req.header("x-forwarded-for");
    const realIp =
      forwardedFor?.split(",")[0]?.trim() ||
      getConnInfo(c)?.remote?.address ||
      "unknown";
    return realIp;
  },
});
app.use("*", (c, next) => {
  const forwardedFor = c.req.header("x-forwarded-for");
  const realIp =
    forwardedFor?.split(",")[0]?.trim() ||
    getConnInfo(c)?.remote?.address ||
    "unknown";
  console.log("realIp", realIp);
  return next();
});
app.use("*", limiter);

// Health Check
app.get("/", (c) => c.text("✅ PrGPT API is live"));
app.get("/health", (c) => c.text("🏥 PrGPT API is live and kicking!"));
app.route("api/pr/generate-title-description", prRoutes);
// Catch-all 404
app.notFound((c) =>
  c.json(
    {message: "The subscriber you have dialed is not in service 💀☠️"},
    404
  )
);

// Error handler
app.onError((err, c) =>
  c.json({message: "🚨 Internal Server Error", error: err.message}, 500)
);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
