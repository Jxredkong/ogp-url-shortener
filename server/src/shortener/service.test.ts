import { describe, it, expect, beforeEach } from "vitest";
import { ShortenerService } from "./service.js";
import { InvalidUrlError } from "./types.js";
import { InMemoryLinkRepository } from "../test/inMemoryRepository.js";

describe("ShortenerService", () => {
  let repo: InMemoryLinkRepository;
  let service: ShortenerService;

  beforeEach(() => {
    repo = new InMemoryLinkRepository();
    service = new ShortenerService(repo as never);
  });

  it("shortens a valid URL and returns a Link", async () => {
    const link = await service.shorten("https://open.gov.sg");
    expect(link.originalUrl).toBe("https://open.gov.sg/");
    expect(link.shortCode).toMatch(/^[A-Za-z0-9]+$/);
    expect(link.clickCount).toBe(0);
  });

  it("rejects invalid URLs", async () => {
    await expect(service.shorten("not a url")).rejects.toThrow(InvalidUrlError);
  });

  it("returns a fresh code by default for repeat URLs", async () => {
    const a = await service.shorten("https://example.com");
    const b = await service.shorten("https://example.com");
    expect(a.shortCode).not.toBe(b.shortCode);
  });

  it("reuses an existing link when reuseIfExists is set", async () => {
    const a = await service.shorten("https://example.com", { reuseIfExists: true });
    const b = await service.shorten("https://example.com", { reuseIfExists: true });
    expect(a.shortCode).toBe(b.shortCode);
  });

  it("resolve increments click_count and returns the link", async () => {
    const created = await service.shorten("https://example.com");
    const r1 = await service.resolve(created.shortCode);
    const r2 = await service.resolve(created.shortCode);
    expect(r1?.clickCount).toBe(1);
    expect(r2?.clickCount).toBe(2);
  });

  it("resolve returns null for unknown codes", async () => {
    expect(await service.resolve("zzzzzzz")).toBeNull();
  });

  it("stats returns the link without incrementing", async () => {
    const created = await service.shorten("https://example.com");
    await service.stats(created.shortCode);
    await service.stats(created.shortCode);
    const fresh = await service.stats(created.shortCode);
    expect(fresh?.clickCount).toBe(0);
  });

  it("recent returns links newest-first", async () => {
    const a = await service.shorten("https://a.example");
    const b = await service.shorten("https://b.example");
    const recent = await service.recent();
    expect(recent[0].shortCode).toBe(b.shortCode);
    expect(recent[1].shortCode).toBe(a.shortCode);
  });
});
