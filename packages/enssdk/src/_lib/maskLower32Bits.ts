/**
 * Masks the lower 32 bits of `num`.
 */
export const maskLower32Bits = (num: bigint) => num ^ (num & 0xffffffffn);
