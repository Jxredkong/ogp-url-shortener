import type { Pool } from "pg";
import type { Link } from "./types.js";

interface LinkRow {
  short_code: string;
  original_url: string;
  created_at: Date;
  click_count: string;
}

function rowToLink(row: LinkRow): Link {
  return {
    shortCode: row.short_code,
    originalUrl: row.original_url,
    createdAt: row.created_at,
    clickCount: Number(row.click_count),
  };
}

export class LinkRepository {
  constructor(private readonly pool: Pool) {}

  /** Inserts a link. Returns null if shortCode is already taken. */
  async insert(shortCode: string, originalUrl: string): Promise<Link | null> {
    try {
      const { rows } = await this.pool.query<LinkRow>(
        `INSERT INTO links (short_code, original_url)
         VALUES ($1, $2)
         RETURNING short_code, original_url, created_at, click_count`,
        [shortCode, originalUrl],
      );
      return rowToLink(rows[0]);
    } catch (err) {
      if (isUniqueViolation(err)) return null;
      throw err;
    }
  }

  async findByCode(shortCode: string): Promise<Link | null> {
    const { rows } = await this.pool.query<LinkRow>(
      `SELECT short_code, original_url, created_at, click_count
         FROM links WHERE short_code = $1`,
      [shortCode],
    );
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  async findByOriginalUrl(originalUrl: string): Promise<Link | null> {
    const { rows } = await this.pool.query<LinkRow>(
      `SELECT short_code, original_url, created_at, click_count
         FROM links WHERE original_url = $1
         ORDER BY created_at DESC LIMIT 1`,
      [originalUrl],
    );
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  /** Atomically bumps click_count and returns the link. */
  async incrementClick(shortCode: string): Promise<Link | null> {
    const { rows } = await this.pool.query<LinkRow>(
      `UPDATE links SET click_count = click_count + 1
         WHERE short_code = $1
         RETURNING short_code, original_url, created_at, click_count`,
      [shortCode],
    );
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  async listRecent(limit: number): Promise<Link[]> {
    const { rows } = await this.pool.query<LinkRow>(
      `SELECT short_code, original_url, created_at, click_count
         FROM links ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(rowToLink);
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505";
}
