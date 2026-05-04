import { describe, it, expect } from "vitest";
import { normaliseUrl } from "./url.js";
import { InvalidUrlError } from "./types.js";

describe("normaliseUrl", () => {
  it("accepts a plain https URL", () => {
    expect(normaliseUrl("https://open.gov.sg/")).toBe("https://open.gov.sg/");
  });

  it("accepts http URLs", () => {
    expect(normaliseUrl("http://example.com")).toBe("http://example.com/");
  });

  it("trims surrounding whitespace", () => {
    expect(normaliseUrl("  https://example.com/path  ")).toBe("https://example.com/path");
  });

  it("rejects empty input", () => {
    expect(() => normaliseUrl("")).toThrow(InvalidUrlError);
    expect(() => normaliseUrl("   ")).toThrow(InvalidUrlError);
  });

  it("rejects malformed URLs", () => {
    expect(() => normaliseUrl("not a url")).toThrow(InvalidUrlError);
    expect(() => normaliseUrl("https://")).toThrow(InvalidUrlError);
  });

  it("rejects non-http(s) protocols", () => {
    expect(() => normaliseUrl("javascript:alert(1)")).toThrow(InvalidUrlError);
    expect(() => normaliseUrl("ftp://example.com")).toThrow(InvalidUrlError);
    expect(() => normaliseUrl("data:text/plain,hello")).toThrow(InvalidUrlError);
  });

  it("rejects URLs over 2048 chars", () => {
    const long = "https://example.com/" + "a".repeat(2048);
    expect(() => normaliseUrl(long)).toThrow(InvalidUrlError);
  });
});
