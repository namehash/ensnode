/**
 * Parses a string into a non-negative integer.
 * @param input The string to parse
 * @returns The parsed non-negative integer
 * @throws Error if the input is not a valid non-negative integer
 */
export function parseNonNegativeInteger(maybeNumber: string): number {
  const trimmed = maybeNumber.trim();

  // Check for empty strings
  if (!trimmed) {
    throw new Error("Input cannot be empty");
  }

  // Check for -0
  if (trimmed === "-0") {
    throw new Error("Negative zero is not a valid non-negative integer");
  }

  const num = Number(maybeNumber);

  // Check if it's not a number
  if (Number.isNaN(num)) {
    throw new Error(`"${maybeNumber}" is not a valid number`);
  }

  // Check if it's not finite
  if (!Number.isFinite(num)) {
    throw new Error(`"${maybeNumber}" is not a finite number`);
  }

  // Check if it's not an integer
  if (!Number.isInteger(num)) {
    throw new Error(`"${maybeNumber}" is not an integer`);
  }

  // Check if it's negative
  if (num < 0) {
    throw new Error(`"${maybeNumber}" is not a non-negative integer`);
  }

  return num;
}
