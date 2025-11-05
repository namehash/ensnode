/**
 * Converts a bigint value into a number value.
 *
 * @throws when value is too low.
 * @throws when value is too high .
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
