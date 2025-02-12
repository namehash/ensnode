/**
 * Parses a string into a non-negative integer.
 * @param input The string to parse
 * @returns The parsed non-negative integer, or null if invalid
 */
export function parseNonNegativeInteger(input: string): number | null {
  const trimmed = input.trim();

  // Early return for empty strings or -0
  if (!trimmed || trimmed === "-0") {
    return null;
  }

  const num = Number(input);

  // Ensure it's a finite number, an integer, and non-negative
  if (Number.isFinite(num) && Number.isInteger(num) && num >= 0) {
    return num;
  }

  return null; // Return null if invalid
}
