/**
 * Decoder for EFP `UpdateListStorageLocation.listStorageLocation` payloads.
 *
 * EFP defines a single location type, `locationType == 1` (onchain EVM contract):
 *
 *   version          (1 byte)
 *   locationType     (1 byte)  // == 0x01
 *   chainId          (32 bytes, big-endian uint256)
 *   contractAddress  (20 bytes)
 *   slot             (32 bytes)
 *
 * Total: 86 bytes. Decodes to `null` unless the payload is exactly this 86-byte, version-1,
 * `locationType == 1` shape; other versions, location types, or lengths are reserved/unknown.
 *
 * @see https://docs.efp.app/design/list-storage-location/
 */

import { type Hex, isHex } from "viem";

import { EFP_LSL_VERSION } from "../constants";

export interface ParsedListStorageLocation {
  version: number;
  chainId: bigint;
  contractAddress: Hex;
  slot: Hex;
}

/** Each byte is two hex characters. */
const HEX_CHARS_PER_BYTE = 2;

// The locationType-1 payload is a fixed 86-byte layout. The boundaries below are hex-char offsets
// into the 0x-stripped payload (each field's byte length times two).
const VERSION_END = 1 * HEX_CHARS_PER_BYTE; // version (1 byte)
const LOCATION_TYPE_END = VERSION_END + 1 * HEX_CHARS_PER_BYTE; // locationType (1 byte)
const CHAIN_ID_END = LOCATION_TYPE_END + 32 * HEX_CHARS_PER_BYTE; // chainId (32 bytes)
const CONTRACT_END = CHAIN_ID_END + 20 * HEX_CHARS_PER_BYTE; // contractAddress (20 bytes)
const SLOT_END = CONTRACT_END + 32 * HEX_CHARS_PER_BYTE; // slot (32 bytes); also the full 86-byte payload length

/** The only `locationType` EFP defines: an onchain EVM contract location. */
const LOCATION_TYPE_ONCHAIN = 1;

export function parseListStorageLocation(
  lsl: Hex | string | null | undefined,
): ParsedListStorageLocation | null {
  if (!lsl || typeof lsl !== "string" || !isHex(lsl)) return null;
  if (lsl.length < LOCATION_TYPE_END + 2) return null; // "0x" + version + locationType

  const bytes = lsl.slice(2);
  const version = parseInt(bytes.slice(0, VERSION_END), 16);
  const locationType = parseInt(bytes.slice(VERSION_END, LOCATION_TYPE_END), 16);

  // The version byte defines the payload schema, and a locationType-1 location is a fixed 86-byte
  // shape; reject other versions, location types, or lengths rather than remap the list from a
  // partially- or over-decoded payload.
  if (version !== EFP_LSL_VERSION) return null;
  if (locationType !== LOCATION_TYPE_ONCHAIN) return null;
  if (bytes.length !== SLOT_END) return null;

  return {
    version,
    chainId: BigInt(`0x${bytes.slice(LOCATION_TYPE_END, CHAIN_ID_END)}`),
    contractAddress: `0x${bytes.slice(CHAIN_ID_END, CONTRACT_END).toLowerCase()}` as Hex,
    slot: `0x${bytes.slice(CONTRACT_END, SLOT_END).toLowerCase()}` as Hex,
  };
}
