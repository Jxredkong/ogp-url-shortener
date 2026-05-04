import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { createSessionToken, validateAccessKey } from "../auth.js";

const authSchema = z.object({ accessKey: z.string().min(1) });

export function createAuthRouter(): Router {
  const router = Router();

  router.post("/auth", (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessKey } = authSchema.parse(req.body);
      if (!validateAccessKey(accessKey)) {
        res.status(401).json({ error: "invalid_access_key" });
        return;
      }
      const token = createSessionToken();
      res.json({ token });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
