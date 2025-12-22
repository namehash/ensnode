import { prettifyError } from "zod/v4";

import { makeNonNegativeIntegerSchema, makePositiveIntegerSchema } from "./zod-schemas";

/**
 * Converts a bigint value into a number value.
 *
 * @throws when value is outside the range of `Number.MIN_SAFE_INTEGER` and
 * `Number.MAX_SAFE_INTEGER`.
 */
export function bigIntToNumber(n: bigint): number {
  if (n < Number.MIN_SAFE_INTEGER) {
    throw new Error(
      `The bigint '${n.toString()}' value is too low to be to converted into a number.'`,
    );
  }

  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `The bigint '${n.toString()}' value is too high to be to converted into a number.'`,
    );
  }

  return Number(n);
}

export function deserializeNonNegativeInteger(
  maybePositiveInteger: unknown,
  valueLabel?: string,
): number {
  const schema = makeNonNegativeIntegerSchema(valueLabel);
  const parsed = schema.safeParse(maybePositiveInteger);

  if (parsed.error) {
    throw new Error(`Cannot deserialize Positive Integer:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializePositiveInteger(
  maybePositiveInteger: unknown,
  valueLabel?: string,
): number {
  const schema = makePositiveIntegerSchema(valueLabel);
  const parsed = schema.safeParse(maybePositiveInteger);

  if (parsed.error) {
    throw new Error(`Cannot deserialize Positive Integer:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
