import { replaceBigInts } from "./replace-bigints";

/**
 * `JSON.stringify` with bigints replaced by their string representation.
 *
 * Defaults to compact output. Pass `{ pretty: true }` for 2-space indent
 * (useful for human-readable error messages and console logs).
 */
export const toJson = (value: unknown, options?: { pretty?: boolean }) =>
  JSON.stringify(replaceBigInts(value, String), null, options?.pretty ? 2 : undefined);
