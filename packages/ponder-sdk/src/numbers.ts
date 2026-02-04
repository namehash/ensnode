import { z } from "zod/v4";

// Numbers

/**
 * Any finite number. Rejects non-finite numbers such as `NaN` and `Infinity`.
 */
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
