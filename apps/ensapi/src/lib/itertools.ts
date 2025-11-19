/**
 * Utility functions for working with iterables, inspired by Python's itertools.
 */

/**
 * Reduces an iterable to a single value using a reducer function.
 * Similar to Array.reduce but works directly on iterables without creating intermediate arrays.
 *
 * @param iterable - The iterable to reduce
 * @param reducer - Function that combines accumulator with each value
 * @param initial - Initial value for the accumulator
 * @returns The final accumulated value
 *
 * @example
 * const sum = ireduce(map.values(), (acc, val) => acc + val.count, 0);
 */
export function ireduce<T, R>(
  iterable: Iterable<T>,
  reducer: (accumulator: R, value: T) => R,
  initial: R,
): R {
  let accumulator = initial;
  for (const value of iterable) {
    accumulator = reducer(accumulator, value);
  }
  return accumulator;
}

/**
 * Returns an iterable containing elements from the iterable from start to stop (exclusive).
 * Similar to Python's itertools.islice.
 *
 * @param iterable - The iterable to slice
 * @param start - Starting index (inclusive)
 * @param stop - Stopping index (exclusive)
 * @returns Iterable containing sliced elements
 *
 * @example
 * const page = islice(map.values(), 0, 25); // First 25 items
 * const page2 = islice(map.values(), 25, 50); // Next 25 items
 * const array = Array.from(islice(map.values(), 0, 25)); // Convert to array if needed
 */
export function* islice<T>(iterable: Iterable<T>, start: number, stop: number): Iterable<T> {
  let index = 0;
  for (const item of iterable) {
    if (index >= stop) break;
    if (index >= start) yield item;
    index++;
  }
}
