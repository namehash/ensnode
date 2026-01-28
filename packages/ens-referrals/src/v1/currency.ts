import { isFiniteNonNegativeNumber } from "./number";

/**
 * Represents a quantity of USD.
 *
 * @invariant Guaranteed to be a finite non-negative number (>= 0)
 */
export type USDQuantity = number;

export function isValidUSDQuantity(value: USDQuantity): boolean {
  return isFiniteNonNegativeNumber(value);
}

export function validateUSDQuantity(value: USDQuantity): void {
  if (!isValidUSDQuantity(value)) {
    throw new Error(`Invalid USD quantity: ${value}.`);
  }
}
