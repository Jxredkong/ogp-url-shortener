import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { isProd } from "./config.js";
import { createLinksRouter } from "./api/links.js";
import { createRedirectRouter } from "./api/redirect.js";
import { errorHandler } from "./api/errors.js";
import { LinkRepository } from "./shortener/repository.js";
import { ShortenerService } from "./shortener/service.js";
import { pool } from "./db/pool.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  if (!isProd) app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const repo = new LinkRepository(pool);
  const service = new ShortenerService(repo);

  app.use("/api", createLinksRouter(service));
  app.use("/", createRedirectRouter(service));

  app.use(errorHandler);

  return app;
}
