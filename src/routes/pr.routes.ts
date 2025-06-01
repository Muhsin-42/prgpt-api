// routes/url.routes.ts
import {Hono} from "hono";
import {generateTitleDescription} from "../controllers/pr.controller";
import {getStats} from "../controllers/pr.controller";
export const prRoutes = new Hono();

// URL routes
prRoutes.post("/generate-title-description", generateTitleDescription);
// stats
prRoutes.get("/stats", getStats);
