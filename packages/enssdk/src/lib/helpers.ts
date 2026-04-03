import { type Hex, toHex } from "viem";

/**
 * Stringify an {@link AssetId} as a fully lowercase CAIP-19 AssetId string.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 */
export const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });
