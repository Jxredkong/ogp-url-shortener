import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { isValidCode } from "../shortener/codes.js";
import type { Link } from "../shortener/types.js";
import type { ShortenerService } from "../shortener/service.js";

const shortenSchema = z.object({
  url: z.string().min(1),
  reuseIfExists: z.boolean().optional(),
});

interface LinkResponse {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  clickCount: number;
}

function toResponse(link: Link): LinkResponse {
  return {
    shortCode: link.shortCode,
    shortUrl: `${config.publicBaseUrl}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    createdAt: link.createdAt.toISOString(),
    clickCount: link.clickCount,
  };
}

export function createLinksRouter(service: ShortenerService): Router {
  const router = Router();

  router.post("/shorten", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, reuseIfExists } = shortenSchema.parse(req.body);
      const link = await service.shorten(url, { reuseIfExists });
      res.status(201).json(toResponse(link));
    } catch (err) {
      next(err);
    }
  });

  router.get("/links", async (_req, res, next) => {
    try {
      const recent = await service.recent(10);
      res.json({ links: recent.map(toResponse) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/links/:code", async (req, res, next) => {
    try {
      const { code } = req.params;
      if (!isValidCode(code)) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      const link = await service.stats(code);
      if (!link) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json(toResponse(link));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
