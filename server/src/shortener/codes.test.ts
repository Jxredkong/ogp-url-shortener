import { describe, it, expect } from "vitest";
import { newCode, isValidCode, CODE_LENGTH } from "./codes.js";

describe("newCode", () => {
  it("returns a string of the expected length", () => {
    const code = newCode();
    expect(code).toHaveLength(CODE_LENGTH);
  });

  it("returns codes that pass isValidCode", () => {
    for (let i = 0; i < 50; i++) expect(isValidCode(newCode())).toBe(true);
  });

  it("does not collide across many calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) codes.add(newCode());
    expect(codes.size).toBe(1000);
  });
});

describe("isValidCode", () => {
  it("rejects wrong length", () => {
    expect(isValidCode("abc")).toBe(false);
    expect(isValidCode("a".repeat(CODE_LENGTH + 1))).toBe(false);
  });

  it("rejects look-alike chars (0, O, 1, l, I)", () => {
    expect(isValidCode("0".repeat(CODE_LENGTH))).toBe(false);
    expect(isValidCode("O".repeat(CODE_LENGTH))).toBe(false);
    expect(isValidCode("1".repeat(CODE_LENGTH))).toBe(false);
    expect(isValidCode("l".repeat(CODE_LENGTH))).toBe(false);
    expect(isValidCode("I".repeat(CODE_LENGTH))).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidCode(undefined as unknown as string)).toBe(false);
    expect(isValidCode(123 as unknown as string)).toBe(false);
  });
});
