import { ErrorResponse } from "./api";

export class ClientError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ClientError";
    this.details = details;
  }

  static fromErrorResponse({ message, details }: ErrorResponse) {
    return new ClientError(message, details);
  }
}
