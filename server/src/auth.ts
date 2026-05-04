import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const SESSION_TTL = "30d";

function getAccessKey(): string {
  const key = process.env.ACCESS_KEY;
  if (!key) throw new Error("ACCESS_KEY environment variable must be set");
  return key;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_KEY;
  if (!secret) throw new Error("JWT_SECRET or ACCESS_KEY must be set");
  return secret;
}

export function validateAccessKey(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  return candidate === getAccessKey();
}

export function createSessionToken(): string {
  return jwt.sign({ authenticated: true }, getJwtSecret(), { expiresIn: SESSION_TTL });
}

export function verifySessionToken(token: string): boolean {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { authenticated?: unknown };
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !verifySessionToken(token)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
};
