import { replaceBigInts } from "ponder";

/**
 * JSON.stringify with bigints replaced.
 */
export const toJson = (value: unknown, pretty = true) =>
  JSON.stringify(replaceBigInts(value, String), null, pretty ? 2 : undefined);
