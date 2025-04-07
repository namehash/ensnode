export class ENSNodeConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ENSNodeConnectionError";
  }
}

export class ENSNodeResponseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ENSNodeResponseValidationError";
  }
}

export const ENSNodeError = {
  ensNodeConnectionError(message?: string) {
    return new ENSNodeConnectionError(
      `Failed to connect to ENSNode${message ? `: ${message}` : ""}`,
    );
  },
  ensNodeResponseValidationError(message?: string) {
    return new ENSNodeResponseValidationError(
      `Invalid ENSNode response${message ? `: ${message}` : ""}`,
    );
  },
};
