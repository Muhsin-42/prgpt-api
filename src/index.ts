import {Hono} from "hono";
import {logger} from "hono/logger";
import {poweredBy} from "hono/powered-by";
import {env} from "./config/env.config";
import {cors} from "hono/cors";
import {prRoutes} from "./routes/pr.routes";
const app = new Hono();

// Global middlewares
app.use("*", logger());
app.use("*", poweredBy());
app.use("*", cors());

// Health Check
app.get("/", (c) => c.text("✅ API is live"));
app.get("/health", (c) => c.text("🏥 Ping is live and kicking!"));
app.route("api/pr/generate-title-description", prRoutes);
// Catch-all 404
app.notFound((c) =>
  c.json(
    {message: "Aapke dwaara dial kiya gaya route asthithwa me nahi he"},
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
