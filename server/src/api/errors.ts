import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { InvalidUrlError, LinkNotFoundError, CodeCollisionError } from "../shortener/types.js";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "validation_error", issues: err.issues });
    return;
  }
  if (err instanceof InvalidUrlError) {
    res.status(400).json({ error: "invalid_url", message: err.message });
    return;
  }
  if (err instanceof LinkNotFoundError) {
    res.status(404).json({ error: "not_found", message: err.message });
    return;
  }
  if (err instanceof CodeCollisionError) {
    res.status(503).json({ error: "code_collision", message: err.message });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: "http_error", message: err.message });
    return;
  }

  console.error("[api] unhandled error", err);
  res.status(500).json({ error: "internal_error" });
};
