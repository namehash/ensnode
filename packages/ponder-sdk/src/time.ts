import type { z } from "zod/v4";

import { schemaInteger } from "./numbers";

//// Unix Timestamp
export const schemaUnixTimestamp = schemaInteger;

/**
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT).
 *
 * Guaranteed to be an integer. May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 */
export type UnixTimestamp = z.infer<typeof schemaUnixTimestamp>;
