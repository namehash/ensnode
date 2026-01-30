/**
 * Escapes the % and _ characters in a string for use within a Postgres LIKE condition.
 */
export function escapeLikeString(input: string) {
  return input.replace(/[%_]/g, "\\$&");
}
