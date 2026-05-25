/**
 * Decoder for EFP `UpdateListStorageLocation.listStorageLocation` payloads.
 *
 * EFP defines a single location type — `locationType == 1` (onchain EVM contract):
 *
 *   version          (1 byte)
 *   locationType     (1 byte)  // == 0x01
 *   chainId          (32 bytes, big-endian uint256)
 *   contractAddress  (20 bytes)
 *   slot             (32 bytes)
 *
 * Total: 86 bytes. Any other `locationType` is reserved/unknown and decodes to `null`.
 *
 * @see https://docs.efp.app/design/list-storage-location/
 */

import { type Hex, isHex } from "viem";

export interface ParsedListStorageLocation {
  version: number;
  chainId: bigint;
  contractAddress: Hex;
  slot: Hex;
}

const HEX_BYTES = 2;
const HEADER_END = 2 * HEX_BYTES; // version + locationType
const CHAIN_END = HEADER_END + 32 * HEX_BYTES;
const ADDRESS_END = CHAIN_END + 20 * HEX_BYTES;
const SLOT_END = ADDRESS_END + 32 * HEX_BYTES;

/** The only `locationType` EFP defines: an onchain EVM contract location. */
const LOCATION_TYPE_ONCHAIN = 1;

export function parseListStorageLocation(
  lsl: Hex | string | null | undefined,
): ParsedListStorageLocation | null {
  if (!lsl || typeof lsl !== "string" || !isHex(lsl)) return null;
  if (lsl.length < HEADER_END + 2) return null; // need at least version + locationType

  const bytes = lsl.slice(2);
  const version = parseInt(bytes.slice(0, HEADER_END / 2), 16);
  const locationType = parseInt(bytes.slice(HEADER_END / 2, HEADER_END), 16);

  if (locationType !== LOCATION_TYPE_ONCHAIN) return null;
  if (bytes.length < SLOT_END) return null;

  return {
    version,
    chainId: BigInt(`0x${bytes.slice(HEADER_END, CHAIN_END)}`),
    contractAddress: `0x${bytes.slice(CHAIN_END, ADDRESS_END).toLowerCase()}` as Hex,
    slot: `0x${bytes.slice(ADDRESS_END, SLOT_END).toLowerCase()}` as Hex,
  };
}
