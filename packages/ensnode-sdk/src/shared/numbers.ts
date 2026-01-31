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

/**
 * Scales a bigint value by a floating-point number while maintaining precision.
 *
 * **How it works:**
 * Converts the float to a fixed-point decimal string, extracts the decimal digits,
 * and performs multiplication using bigint arithmetic: `(value * numerator) / denominator`.
 *
 * **Important:** JavaScript floats (IEEE 754 double-precision) have ~15-17 significant
 * decimal digits. Any imprecision in the input `scaleFactor` will be reflected in the result.
 * For example, `1/3` in JavaScript is `0.3333333333333333...` (not infinite threes), and
 * this function accurately preserves that limitation.
 *
 * @param value - The bigint value to scale (must be non-negative)
 * @param scaleFactor - The non-negative number to multiply by (can be a decimal like 0.5 or 0.333)
 * @returns The scaled bigint value, rounded down via integer division
 *
 * @throws {Error} If value is negative
 * @throws {Error} If scaleFactor is negative, NaN, or infinite
 *
 * @example
 * // Scale by 0.5
 * scaleBigintByNumber(1000n, 0.5) // returns 500n
 *
 * @example
 * // Scale by 1/3 (uses JavaScript's float representation)
 * scaleBigintByNumber(1000n, 1/3) // returns 333n
 *
 * @example
 * // Scale USDC amount (6 decimals) by percentage
 * scaleBigintByNumber(5000000000n, 0.4) // 5000 USDC * 0.4 = 2000000000n (2000 USDC)
 */
export function scaleBigintByNumber(value: bigint, scaleFactor: number): bigint {
  // Validate inputs
  if (value < 0n) {
    throw new Error(`scaleBigintByNumber: value must be non-negative, got: ${value.toString()}`);
  }

  if (!Number.isFinite(scaleFactor)) {
    throw new Error(
      `scaleBigintByNumber: scaleFactor must be a finite number, got: ${scaleFactor}`,
    );
  }

  if (scaleFactor < 0) {
    throw new Error(`scaleBigintByNumber: scaleFactor must be non-negative, got: ${scaleFactor}`);
  }

  // Handle special cases
  if (value === 0n || scaleFactor === 0) {
    return 0n;
  }

  if (scaleFactor === 1) {
    return value;
  }

  // Convert the float to a fixed-point decimal string with 20 decimal places.
  // Why 20?
  // - JavaScript floats have ~15-17 significant digits of precision (IEEE 754)
  // - Using 20 ensures we capture all meaningful precision
  // - Avoids scientific notation (e.g., "1e-10") which would break our parsing
  // - Extra digits beyond float precision are deterministic (not random noise)
  const fixedStr = scaleFactor.toFixed(20);

  // Split into integer and decimal parts
  // Example: "0.50000000000000000000" -> ["0", "50000000000000000000"]
  const [integerPart, decimalPart = ""] = fixedStr.split(".");

  // Remove trailing zeros to get the minimal precision needed
  // Example: "50000000000000000000" -> "5"
  // This optimization reduces the size of numerator/denominator
  const trimmedDecimal = decimalPart.replace(/0+$/, "") || "0";

  // Construct the numerator by concatenating integer and decimal parts
  // Example: integerPart="0", trimmedDecimal="5" -> "05" -> BigInt = 5n
  const numerator = BigInt(integerPart + trimmedDecimal);

  // Denominator is 10^(number of decimal digits we kept)
  // Example: trimmedDecimal.length = 1 -> 10^1 = 10n
  const denominator = 10n ** BigInt(trimmedDecimal.length);

  // Perform the multiplication and division in bigint space
  // Formula: (value * numerator) / denominator
  // Example: (1000n * 5n) / 10n = 5000n / 10n = 500n
  // Integer division automatically floors the result
  return (value * numerator) / denominator;
}
