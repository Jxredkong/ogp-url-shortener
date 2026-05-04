export interface Link {
  shortCode: string;
  originalUrl: string;
  createdAt: Date;
  clickCount: number;
}

export class InvalidUrlError extends Error {
  constructor(message = "Invalid URL") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export class LinkNotFoundError extends Error {
  constructor(shortCode: string) {
    super(`No link for code: ${shortCode}`);
    this.name = "LinkNotFoundError";
  }
}

export class CodeCollisionError extends Error {
  constructor() {
    super("Failed to allocate a unique short code after retries");
    this.name = "CodeCollisionError";
  }
}
