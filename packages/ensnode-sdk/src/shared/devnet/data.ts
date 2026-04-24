import type { Hex } from "viem";

export const DEVNET_BYTES: Record<string, Hex> = {
  abiBytes: `0x${"01".repeat(32)}` as Hex,
  fourBytesInterface: "0x11100111" as Hex,
  publicKeyX: `0x${"02".repeat(32)}` as Hex,
  publicKeyY: `0x${"03".repeat(32)}` as Hex,
  contenthash: `0x${"04".repeat(32)}` as Hex,
  bitcoinAddress: `0x${"05".repeat(25)}` as Hex,
  litecoinAddress: `0x${"06".repeat(25)}` as Hex,
};
