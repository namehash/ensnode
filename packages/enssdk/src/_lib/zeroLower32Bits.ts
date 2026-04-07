/**
 * Zeros the lower 32 bits of `num`.
 */
export const zeroLower32Bits = (num: bigint) => num ^ (num & 0xffffffffn);
