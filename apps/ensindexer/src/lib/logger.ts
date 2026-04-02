import { prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

if (!globalThis.PONDER_COMMON?.logger) {
  throw new Error(
    "Ponder Common Logger must be provided by Ponder runtime at globalThis.PONDER_COMMON.logger",
  );
}

/**
 * Logger instance for ENSIndexer to use.
 */
export const logger = globalThis.PONDER_COMMON.logger;

/**
 * Formats a log parameter as a single-line, compact JSON string.
 * This is useful for logging complex objects inline without extra whitespace
 * or newlines.
 */
export const formatLogParam = (param: unknown): string =>
  prettyPrintJson(param)
    .split("\n")
    .map((line) =>
      line
        .trim()
        // This regex only removes the whitespace after
        // a top-level JSON key's closing quote, leaving any colons inside
        // string values untouched.
        .replace(/^("(?:[^"\\]|\\.)*"):\s/, "$1:"),
    )
    .join("")
    .trim();

/**
 * Builds the value to be used for the `error` property in log messages.
 */
export const buildLogError = (error: unknown): Error | undefined => {
  if (error instanceof Error) {
    return error;
  }

  return undefined;
};
