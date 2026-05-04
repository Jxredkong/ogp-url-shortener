import { InvalidUrlError } from "./types.js";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 2048;

export function normaliseUrl(input: string): string {
  if (typeof input !== "string") throw new InvalidUrlError();
  const trimmed = input.trim();
  if (trimmed.length === 0) throw new InvalidUrlError("URL is required");
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new InvalidUrlError(`URL exceeds ${MAX_URL_LENGTH} characters`);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidUrlError("URL is not well-formed");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new InvalidUrlError("Only http and https URLs are supported");
  }
  if (url.hostname.length === 0) {
    throw new InvalidUrlError("URL is missing a hostname");
  }

  return url.toString();
}
