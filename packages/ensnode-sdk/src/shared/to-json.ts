/**
 * `JSON.stringify` with bigints replaced by their string representation.
 *
 * Defaults to compact output. Pass `{ pretty: true }` for 2-space indent
 * (useful for human-readable error messages and console logs).
 *
 * Uses `JSON.stringify`'s replacer callback so native `toJSON` behavior is
 * preserved (e.g. `Date` serializes to its ISO string).
 */
export const toJson = (value: unknown, options?: { pretty?: boolean }) =>
  JSON.stringify(
    value,
    (_key, val) => (typeof val === "bigint" ? String(val) : val),
    options?.pretty ? 2 : undefined,
  );
