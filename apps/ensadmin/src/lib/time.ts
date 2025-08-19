/**
 * Renders microseconds in human-friendly us, ms, or s units.
 *
 * @param us microseconds
 * @returns string representation of the duration
 */
export const renderMicroseconds = (us: number) => {
  if (us < 1_000) return `${us}µs`;
  if (us < 1_000_000) return `${(us / 1_000).toFixed(2)}ms`;
  return `${(us / 1_000_000).toFixed(4)}s`;
};
