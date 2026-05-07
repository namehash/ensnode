import { type BinaryLike, createHash } from "node:crypto";

/**
 * Create a checksum for the given data
 *
 * @param data - The data to create a checksum for
 * @returns A 10-character hash string representing the checksum of the data
 *
 */
export function createChecksum(data: BinaryLike): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 10);
}
