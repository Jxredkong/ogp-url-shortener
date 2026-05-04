import { newCode } from "./codes.js";
import { LinkRepository } from "./repository.js";
import { CodeCollisionError, type Link } from "./types.js";
import { normaliseUrl } from "./url.js";

const MAX_INSERT_ATTEMPTS = 5;

export interface ShortenOptions {
  /** If true, return the existing link when this URL has been shortened before. */
  reuseIfExists?: boolean;
}

export class ShortenerService {
  constructor(private readonly repo: LinkRepository) {}

  async shorten(rawUrl: string, opts: ShortenOptions = {}): Promise<Link> {
    const url = normaliseUrl(rawUrl);

    if (opts.reuseIfExists) {
      const existing = await this.repo.findByOriginalUrl(url);
      if (existing) return existing;
    }

    for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt++) {
      const code = newCode();
      const inserted = await this.repo.insert(code, url);
      if (inserted) return inserted;
    }
    throw new CodeCollisionError();
  }

  async resolve(shortCode: string): Promise<Link | null> {
    return this.repo.incrementClick(shortCode);
  }

  async stats(shortCode: string): Promise<Link | null> {
    return this.repo.findByCode(shortCode);
  }

  async recent(limit = 10): Promise<Link[]> {
    return this.repo.listRecent(Math.min(Math.max(limit, 1), 50));
  }
}
