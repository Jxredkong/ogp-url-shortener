import type { Link } from "../shortener/types.js";
import type { LinkRepository } from "../shortener/repository.js";

export class InMemoryLinkRepository implements Pick<LinkRepository, "insert" | "findByCode" | "findByOriginalUrl" | "incrementClick" | "listRecent"> {
  private readonly byCode = new Map<string, Link>();
  private clock = Date.now();

  async insert(shortCode: string, originalUrl: string): Promise<Link | null> {
    if (this.byCode.has(shortCode)) return null;
    this.clock += 1;
    const link: Link = {
      shortCode,
      originalUrl,
      createdAt: new Date(this.clock),
      clickCount: 0,
    };
    this.byCode.set(shortCode, link);
    return link;
  }

  async findByCode(shortCode: string): Promise<Link | null> {
    return this.byCode.get(shortCode) ?? null;
  }

  async findByOriginalUrl(originalUrl: string): Promise<Link | null> {
    const matches = Array.from(this.byCode.values())
      .filter((l) => l.originalUrl === originalUrl)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ?? null;
  }

  async incrementClick(shortCode: string): Promise<Link | null> {
    const existing = this.byCode.get(shortCode);
    if (!existing) return null;
    const updated: Link = { ...existing, clickCount: existing.clickCount + 1 };
    this.byCode.set(shortCode, updated);
    return updated;
  }

  async listRecent(limit: number): Promise<Link[]> {
    return Array.from(this.byCode.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
