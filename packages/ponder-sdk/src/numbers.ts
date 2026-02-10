import { z } from "zod/v4";

// Numbers

/**
 * Any finite number. Rejects non-finite numbers such as `NaN` and `Infinity`.
 */
export const schemaNumber = z.number({ error: `Value must be a number` });

export const schemaInteger = schemaNumber.int({ error: `Value must be an integer` });

export const schemaNonnegativeNumber = schemaNumber.nonnegative({
  error: `Value must be non-negative`,
});

export const schemaPositiveNumber = schemaNumber.positive({ error: `Value must be positive` });

export const schemaNonnegativeInteger = schemaInteger.nonnegative({
  error: `Value must be a non-negative integer`,
});

export const schemaPositiveInteger = schemaInteger.positive({
  error: `Value must be a positive integer`,
});
