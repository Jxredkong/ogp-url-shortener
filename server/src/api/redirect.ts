import { Router, type Request, type Response, type NextFunction } from "express";
import { isValidCode } from "../shortener/codes.js";
import type { ShortenerService } from "../shortener/service.js";

export function createRedirectRouter(service: ShortenerService): Router {
  const router = Router();

  router.get("/:code", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      if (!isValidCode(code)) {
        next();
        return;
      }
      const link = await service.resolve(code);
      if (!link) {
        next();
        return;
      }
      res.redirect(302, link.originalUrl);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
