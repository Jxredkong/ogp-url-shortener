import express, { type Express } from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

  app.use(
    helmet({
      // The shader gradient pulls webgl shaders that helmet's default CSP blocks;
      // we serve the SPA on the same origin so loosening to defaults is safe.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
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

  // Serve the built client. The redirect router above runs first so a request
  // for /:code never falls through to the SPA index when the code resolves.
  if (isProd) {
    const clientDir = resolveClientDir();
    if (clientDir) {
      app.use(express.static(clientDir, { index: false, maxAge: "1h" }));
      app.get("*", (_req, res, next) => {
        const indexPath = join(clientDir, "index.html");
        if (!existsSync(indexPath)) return next();
        res.sendFile(indexPath);
      });
    } else {
      console.warn("[server] no client build found; SPA will not be served");
    }
  }

  app.use(errorHandler);

  return app;
}

function resolveClientDir(): string | null {
  // server starts from server/dist/index.js in prod -> ../client/dist
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, "../../client/dist"),
    resolve(here, "../../../client/dist"),
    resolve(process.cwd(), "client/dist"),
  ];
  return candidates.find((p) => existsSync(join(p, "index.html"))) ?? null;
}
