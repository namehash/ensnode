/**
 * Revenue Contribution
 *
 * Represents the total revenue contribution (in Wei) made to the ENS DAO.
 *
 * This is the sum of the total cost paid by registrants for registrar actions.
 * From the perspective of the ENS DAO, this represents revenue received.
 *
 * @invariant Guaranteed to be a non-negative bigint value (>= 0n)
 * @invariant Never null (records with null `total` in the database are treated as 0 when summing)
 */
export type RevenueContribution = bigint;

/**
 * Check if a value is a valid revenue contribution.
 *
 * @param value - The value to check
 * @returns true if the value is a non-negative bigint, false otherwise
 */
export function isValidRevenueContribution(value: unknown): value is RevenueContribution {
  return typeof value === "bigint" && value >= 0n;
}

/**
 * Validate that a value is a valid revenue contribution.
 *
 * @param value - The value to validate
 * @throws {Error} If the value is not a valid revenue contribution
 */
export function validateRevenueContribution(value: unknown): void {
  if (typeof value !== "bigint") {
    throw new Error(`Invalid revenue contribution: must be a bigint, got: ${typeof value}`);
  }

  if (value < 0n) {
    throw new Error(`Invalid revenue contribution: must be non-negative, got: ${value.toString()}`);
  }
}
