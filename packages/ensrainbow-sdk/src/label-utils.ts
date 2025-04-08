import type { Labelhash } from "@ensnode/utils";
import { ByteArray, hexToBytes } from "viem";

/**
 * Converts a Labelhash to bytes, with validation
 * @param labelHash The Labelhash to convert
 * @returns A ByteArray containing the bytes
 * @throws Error if `labelHash` is not a valid 32-byte hex string
 */
export function labelHashToBytes(labelHash: Labelhash): ByteArray {
  try {
    if (labelHash.length !== 66) {
      throw new Error(`Invalid labelhash length ${labelHash.length} characters (expected 66)`);
    }
    if (labelHash !== labelHash.toLowerCase()) {
      throw new Error("Labelhash must be in lowercase");
    }
    if (!labelHash.startsWith("0x")) {
      throw new Error("Labelhash must be 0x-prefixed");
    }
    const bytes = hexToBytes(labelHash);
    if (bytes.length !== 32) {
      // should be redundant but keeping it for the principle of defensive programming
      throw new Error(`Invalid labelhash length ${bytes.length} bytes (expected 32)`);
    }
    return bytes;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Invalid hex format");
  }
}
