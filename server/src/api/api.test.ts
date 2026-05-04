import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";

vi.mock("../db/pool.js", () => ({ pool: {}, closePool: async () => undefined }));

import request from "supertest";
import { createApp } from "../app.js";
import { ShortenerService } from "../shortener/service.js";
import { InMemoryLinkRepository } from "../test/inMemoryRepository.js";

const ACCESS_KEY = "test-access-key";

beforeAll(() => {
  process.env.ACCESS_KEY = ACCESS_KEY;
  process.env.JWT_SECRET = "test-jwt-secret";
});

function makeApp() {
  const repo = new InMemoryLinkRepository();
  const service = new ShortenerService(repo as never);
  return { app: createApp({ service }), service };
}

async function authedRequest(app: ReturnType<typeof makeApp>["app"]) {
  const res = await request(app).post("/api/auth").send({ accessKey: ACCESS_KEY });
  return res.body.token as string;
}

describe("API", () => {
  let ctx: ReturnType<typeof makeApp>;
  let token: string;
  beforeEach(async () => {
    ctx = makeApp();
    token = await authedRequest(ctx.app);
  });

  it("GET /health returns ok", async () => {
    const res = await request(ctx.app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /api/shorten creates a link", async () => {
    const res = await request(ctx.app).post("/api/shorten").set("Authorization", `Bearer ${token}`).send({ url: "https://open.gov.sg/" });
    expect(res.status).toBe(201);
    expect(res.body.originalUrl).toBe("https://open.gov.sg/");
    expect(res.body.shortCode).toBeTruthy();
    expect(res.body.shortUrl).toContain(`/${res.body.shortCode}`);
    expect(res.body.clickCount).toBe(0);
  });

  it("POST /api/shorten 400s on invalid URL", async () => {
    const res = await request(ctx.app).post("/api/shorten").set("Authorization", `Bearer ${token}`).send({ url: "javascript:alert(1)" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_url");
  });

  it("POST /api/shorten 400s on missing body field", async () => {
    const res = await request(ctx.app).post("/api/shorten").set("Authorization", `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("GET /:code redirects to original URL and bumps clicks", async () => {
    const created = await request(ctx.app).post("/api/shorten").set("Authorization", `Bearer ${token}`).send({ url: "https://example.com/" });
    const code = created.body.shortCode as string;

    const r = await request(ctx.app).get(`/${code}`).redirects(0);
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe("https://example.com/");

    const stats = await request(ctx.app).get(`/api/links/${code}`).set("Authorization", `Bearer ${token}`);
    expect(stats.body.clickCount).toBe(1);
  });

  it("GET /:code with bad code shape falls through to 404", async () => {
    const r = await request(ctx.app).get("/!!!").redirects(0);
    expect(r.status).toBe(404);
  });

  it("GET /api/links/:code returns 404 for unknown code", async () => {
    const r = await request(ctx.app).get("/api/links/zzzzzzz").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(404);
  });

  it("GET /api/links lists recent links newest-first", async () => {
    const auth = `Bearer ${token}`;
    const a = await request(ctx.app).post("/api/shorten").set("Authorization", auth).send({ url: "https://a.example/" });
    const b = await request(ctx.app).post("/api/shorten").set("Authorization", auth).send({ url: "https://b.example/" });
    const r = await request(ctx.app).get("/api/links").set("Authorization", auth);
    expect(r.status).toBe(200);
    expect(r.body.links[0].shortCode).toBe(b.body.shortCode);
    expect(r.body.links[1].shortCode).toBe(a.body.shortCode);
  });

  it("reuseIfExists returns the same code for repeat URLs", async () => {
    const auth = `Bearer ${token}`;
    const a = await request(ctx.app).post("/api/shorten").set("Authorization", auth).send({ url: "https://example.com", reuseIfExists: true });
    const b = await request(ctx.app).post("/api/shorten").set("Authorization", auth).send({ url: "https://example.com", reuseIfExists: true });
    expect(a.body.shortCode).toBe(b.body.shortCode);
  });
});

describe("auth gate", () => {
  let ctx: ReturnType<typeof makeApp>;
  beforeEach(() => {
    ctx = makeApp();
  });

  it("POST /api/auth issues a token for a valid access key", async () => {
    const r = await request(ctx.app).post("/api/auth").send({ accessKey: ACCESS_KEY });
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe("string");
    expect(r.body.token.length).toBeGreaterThan(20);
  });

  it("POST /api/auth 401s on wrong access key", async () => {
    const r = await request(ctx.app).post("/api/auth").send({ accessKey: "nope" });
    expect(r.status).toBe(401);
    expect(r.body.error).toBe("invalid_access_key");
  });

  it("POST /api/shorten without token returns 401", async () => {
    const r = await request(ctx.app).post("/api/shorten").send({ url: "https://example.com" });
    expect(r.status).toBe(401);
  });

  it("POST /api/shorten with bad token returns 401", async () => {
    const r = await request(ctx.app).post("/api/shorten").set("Authorization", "Bearer not-a-jwt").send({ url: "https://example.com" });
    expect(r.status).toBe(401);
  });

  it("GET /api/links without token returns 401", async () => {
    const r = await request(ctx.app).get("/api/links");
    expect(r.status).toBe(401);
  });

  it("redirect /:code stays public (no auth needed)", async () => {
    const t = await authedRequest(ctx.app);
    const created = await request(ctx.app).post("/api/shorten").set("Authorization", `Bearer ${t}`).send({ url: "https://example.com/" });
    const r = await request(ctx.app).get(`/${created.body.shortCode}`).redirects(0);
    expect(r.status).toBe(302);
  });

  it("/health stays public", async () => {
    const r = await request(ctx.app).get("/health");
    expect(r.status).toBe(200);
  });
});
