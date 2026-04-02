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
 * Formats a log parameter as a pretty-printed JSON string.
 * This is useful for logging complex objects in a readable format.
 */
export const formatLogParam = (param: unknown): string =>
  prettyPrintJson(param)
    .split("\n")
    .map((line) => line.trim().replace(": ", ":"))
    .join("")
    .trim();
