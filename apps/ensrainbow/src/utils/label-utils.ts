import { Hex, hexToBytes } from "viem";

/**
 * Converts a label hash to bytes, with validation
 * @param labelHash The label hash to convert
 * @returns A Buffer containing the bytes
 * @throws Error if the input is not a valid 32-byte hex string
 */
export function labelHashToBytes(labelHash: Hex): Buffer {
  try {
    const bytes = hexToBytes(labelHash);
    if (bytes.length !== 32) {
      throw new Error(`Invalid hash length ${bytes.length} bytes (expected 32)`);
    }
    return Buffer.from(bytes);
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Invalid hex format");
  }
}
