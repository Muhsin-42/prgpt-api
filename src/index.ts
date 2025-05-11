import {Hono} from "hono";
import {logger} from "hono/logger";
import {getConnInfo} from "hono/bun";
import {poweredBy} from "hono/powered-by";
import {env} from "./config/env.config";
import {cors} from "hono/cors";
import {prRoutes} from "./routes/pr.routes";
import {rateLimiter} from "hono-rate-limiter";
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", poweredBy());
app.use("*", cors());

const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-7",
  keyGenerator: (c) => getConnInfo(c)?.remote?.address!,
});

app.use("*", (c, next) => {
  console.log(getConnInfo(c)?.remote?.address);
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
