/**
 * Pure decoders for EFP `ListOp.op` payloads.
 *
 * Wire format (one byte = two hex chars):
 *
 *   ListOp.op   := version (1) | opcode (1) | data (variable)
 *   record      := recordVersion (1) | recordType (1) | recordData (variable)
 *
 * EFP defines only `recordType === 1` (a 20-byte address); reserved types are skipped. Managers
 * sometimes append junk after the 20-byte address, so type-1 records are truncated to the canonical
 * `recordVersion (1) | recordType (1) | address (20)` 22-byte prefix (api-v2 parity) and keyed by it,
 * so tag/remove ops, which carry that same prefix, always resolve to the same record.
 *
 * @see https://docs.efp.app/design/list-ops/
 */

import { type NormalizedAddress, toNormalizedAddress } from "enssdk";
import { type Hex, hexToString, isHex, numberToHex } from "viem";

import { EFP_LIST_OP_VERSION, EFP_RECORD_TYPE_ADDRESS, EFP_RECORD_VERSION } from "./constants";

export interface ParsedListOp {
  /** Opcode — see {@link import("../constants").EFP_OPCODE}. */
  opcode: number;
  /** Opcode-specific payload, still 0x-prefixed. */
  data: Hex;
}

export interface ParsedRecord {
  /** Record encoding version. Always 1 today. */
  version: number;
  /** Record type (1 = 20-byte address). */
  recordType: number;
  /**
   * Canonical record bytes `recordVersion | recordType | address` (0x-prefixed, exactly 22 bytes),
   * with any trailing junk after the 20-byte address truncated. Records are keyed by this so tag
   * and remove ops, which carry the same 22-byte prefix, resolve to the same row.
   */
  record: Hex;
  /** Record payload — for `recordType === 1`, the 20-byte followed address. */
  recordData: NormalizedAddress;
}

export interface ParsedTagOp {
  /** Full record prefix `recordVersion | recordType | address`, 0x-prefixed (22 bytes). */
  record: Hex;
  /** UTF-8 decoded tag (NULL bytes stripped, matching api-v2 behaviour). */
  tag: string;
}

const ADDRESS_RECORD_HEX_BODY_LENGTH = 40; // 20 bytes
const RECORD_HEADER_HEX_LENGTH = 4; // 2 bytes (version + type)
const RECORD_PREFIX_HEX_LENGTH = RECORD_HEADER_HEX_LENGTH + ADDRESS_RECORD_HEX_BODY_LENGTH; // 44 hex chars
const RECORD_PREFIX_WITH_0X_LENGTH = RECORD_PREFIX_HEX_LENGTH + 2; // 46 chars (includes "0x")

/**
 * Upper bound on a tag's decoded byte length. Tags are short labels (e.g. "block", "close-friend"),
 * but the on-chain payload is arbitrary bytes, so a pathological op could carry an enormous tag. Cap
 * it generously and skip anything larger rather than store an oversized DB row.
 */
const MAX_TAG_BYTE_LENGTH = 512;

/**
 * Decode a `ListOp.op` payload. Returns `null` for malformed input rather than throwing, matching
 * the resilient behaviour of the api-v2 indexer (which logs and skips bad ops).
 */
export function parseListOp(op: Hex | string | null | undefined): ParsedListOp | null {
  if (!op || typeof op !== "string" || !isHex(op)) return null;
  // Minimum: "0x" + 2 (version) + 2 (opcode) = 6 chars
  if (op.length < 6) return null;

  const bytes = op.slice(2);
  const version = parseInt(bytes.slice(0, 2), 16);
  // The version byte defines the op schema; EFP defines only version 1. Reject other versions so a
  // future/unknown schema is never dispatched through the v1 opcode handlers.
  if (version !== EFP_LIST_OP_VERSION) return null;

  return {
    opcode: parseInt(bytes.slice(2, 4), 16),
    data: `0x${bytes.slice(4)}` as Hex,
  };
}

/**
 * Decode a record payload as it appears inside an ADD_RECORD / REMOVE_RECORD list op. Returns
 * `null` for anything other than an address record (`recordType === 1`) carrying a full 20-byte
 * address: reserved record types and shorter payloads are unrecoverable and skipped, since EFP
 * defines only the address record and the API has no representation for the others. Trailing junk
 * after the 20-byte address is truncated, and `record` is the resulting canonical 22-byte prefix.
 */
export function parseRecord(data: Hex | string | null | undefined): ParsedRecord | null {
  if (!data || typeof data !== "string" || !isHex(data)) return null;
  if (data.length < 6) return null; // "0x" + 4 hex chars of header

  const bytes = data.slice(2);
  const version = parseInt(bytes.slice(0, 2), 16);
  const recordType = parseInt(bytes.slice(2, 4), 16);

  // The version byte is part of the record's decoding contract; EFP defines only version 1.
  if (version !== EFP_RECORD_VERSION) return null;
  // EFP defines only the address record type (a 20-byte address); types 0 and 2-255 are reserved.
  if (recordType !== EFP_RECORD_TYPE_ADDRESS) return null;

  // Truncate any trailing junk to the 20-byte address; reject inputs missing the full address.
  const body = bytes.slice(
    RECORD_HEADER_HEX_LENGTH,
    RECORD_HEADER_HEX_LENGTH + ADDRESS_RECORD_HEX_BODY_LENGTH,
  );
  if (body.length < ADDRESS_RECORD_HEX_BODY_LENGTH) return null;

  return {
    version,
    recordType,
    // `record` is the composite `version | type | address` prefix (not a plain address), so it has
    // no branded type; lowercase it so the canonical key matches across ADD / REMOVE / tag ops.
    record: `0x${bytes.slice(0, RECORD_PREFIX_HEX_LENGTH).toLowerCase()}` as Hex,
    recordData: toNormalizedAddress(`0x${body}`),
  };
}

/**
 * Decode an ADD_TAG / REMOVE_TAG payload, where the data layout is
 * `record (22 bytes) | tag (UTF-8 bytes)`. Returns `null` when the record prefix is missing or is
 * not a valid address record.
 */
export function parseTagOp(data: Hex | string | null | undefined): ParsedTagOp | null {
  if (!data || typeof data !== "string" || !isHex(data)) return null;
  if (data.length < RECORD_PREFIX_WITH_0X_LENGTH) return null;

  // Validate and canonicalize the 22-byte record prefix exactly as `parseRecord` does (version /
  // type checked, lowercased), so the tag keys into the same row the record was stored under.
  const parsed = parseRecord(data.slice(0, RECORD_PREFIX_WITH_0X_LENGTH) as Hex);
  if (!parsed) return null;

  const tagHex = data.slice(RECORD_PREFIX_WITH_0X_LENGTH);
  // hex must contain whole bytes
  if (tagHex.length % 2 !== 0) return null;
  // Reject an over-long tag rather than index an unbounded, attacker-controlled payload.
  if (tagHex.length > MAX_TAG_BYTE_LENGTH * 2) return null;

  // Match api-v2: decode as UTF-8 and strip embedded NULLs.
  const tag = hexToString(`0x${tagHex}`).replace(/\0/g, "");

  return { record: parsed.record, tag };
}

/**
 * Zero-pad a `uint256` slot value (as emitted by the contracts) to a `bytes32` Hex for consistent
 * key lookups across the EFP data model.
 */
export function slotToBytes32(slot: bigint): Hex {
  return numberToHex(slot, { size: 32 });
}
