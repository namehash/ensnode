import { replaceBigInts } from "ponder";

export const toJson = (value: unknown, pretty = true) =>
  JSON.stringify(replaceBigInts(value, String), null, pretty ? 2 : undefined);
