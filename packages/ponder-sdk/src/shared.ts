import { z } from "zod/v4";

// Numbers

export const numberSchema = z.number({ error: `Value must be a number` });

export const integerSchema = numberSchema.int({ error: `Value must be an integer` });

export const nonnegativeNumberSchema = numberSchema.nonnegative({
  error: `Value must be non-negative`,
});

export const positiveNumberSchema = numberSchema.positive({ error: `Value must be positive` });

export const nonnegativeIntegerSchema = integerSchema.nonnegative({
  error: `Value must be a non-negative integer`,
});

export const positiveIntegerSchema = integerSchema.positive({
  error: `Value must be a positive integer`,
});

//// Unix Timestamp
export const unixTimestampSchema = integerSchema;

/**
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT).
 *
 * Guaranteed to be an integer. May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 */
export type UnixTimestamp = z.infer<typeof unixTimestampSchema>;
