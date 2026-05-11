import { createHash } from "node:crypto";

/**
 * Generate a stable arbitrary advisory lock ID for the given name.
 *
 * @param name - The name to derive the advisory lock ID from. This should be
 *               a fixed string that uniquely identifies the critical section of code that
 *               requires synchronization, such as "schema-migrations".
 * @returns A bigint representing the advisory lock ID to be used with PostgreSQL advisory locks.
 */
export function advisoryLockId(name: string): bigint {
  const hash = createHash("sha256").update(name).digest();
  // Read the first 8 bytes as a signed 64-bit integer (Postgres bigint range)
  return hash.readBigInt64BE(0);
}
