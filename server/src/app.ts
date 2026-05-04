import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { isProd } from "./config.js";
import { createAuthRouter } from "./api/auth.js";
import { createLinksRouter } from "./api/links.js";
import { createRedirectRouter } from "./api/redirect.js";
import { errorHandler } from "./api/errors.js";
import { requireAuth } from "./auth.js";
import { LinkRepository } from "./shortener/repository.js";
import { ShortenerService } from "./shortener/service.js";
import { pool } from "./db/pool.js";

export interface CreateAppOptions {
  service?: ShortenerService;
}

export function createApp(opts: CreateAppOptions = {}): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  if (!isProd) app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const service = opts.service ?? new ShortenerService(new LinkRepository(pool));

  // Public: redeem an access key for a session token
  app.use("/api", createAuthRouter());
  // Protected: link create / list / stats sit behind requireAuth
  app.use("/api", requireAuth, createLinksRouter(service));
  // Public: short-code redirect — short URLs are useless if gated
  app.use("/", createRedirectRouter(service));

  app.use(errorHandler);

  return app;
}
