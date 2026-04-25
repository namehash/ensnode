import type { Hex } from "viem";

/**
 * Bytes constants used only for seeding devnet and testing.
 */
export const DEVNET_BYTES = {
  abiBytes: `0x${"01".repeat(32)}`,
  fourBytesInterface: "0x11100111",
  publicKeyX: `0x${"02".repeat(32)}`,
  publicKeyY: `0x${"03".repeat(32)}`,
  contenthash: `0x${"04".repeat(32)}`,
  bitcoinAddress: `0x${"05".repeat(25)}`,
  litecoinAddress: `0x${"06".repeat(25)}`,
} as const satisfies Record<string, Hex>;
