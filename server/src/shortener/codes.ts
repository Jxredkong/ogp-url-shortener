import { customAlphabet } from "nanoid";

// URL-safe alphabet, no look-alike chars (no 0/O, 1/l/I)
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const CODE_LENGTH = 7;

const generate = customAlphabet(ALPHABET, CODE_LENGTH);

export function newCode(): string {
  return generate();
}

const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export function isValidCode(value: string): boolean {
  return typeof value === "string" && CODE_PATTERN.test(value);
}
