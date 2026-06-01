import type { Hex, InterpretedName, LiteralName } from "enssdk";
import { isInterpretedName } from "enssdk";
import { isHex, zeroAddress } from "viem";

import { hasNullByte } from "../null-bytes";

/**
 * Interprets a name record value string and returns null if the value is interpreted as a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existent or deletion of the record, or
 * b) an {@link InterpretedName}.
 *
 * @param value - The name record value string to interpret.
 * @returns The interpreted name string, or null if deleted.
 */
export function interpretNameRecordValue(value: LiteralName): InterpretedName | null {
  // empty string is technically an InterpretedName, representing the ens root node, but in the
  // context of a name record value, empty string is emitted when the user un-sets the record (this
  // is because the abi of this event is only capable of expressing string values, so empty string
  // canonically represents the non-existence or deletion of the record value)
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isInterpretedName(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value;
}

/**
 * Interprets an address record value and returns null if the value is interpreted as a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existent or deletion of the record, or
 *   i. empty hex (0x)
 *   ii. not valid hex
 *   iii. zeroAddress
 * b) the on-chain record bytes as hex
 *
 * @param value - The address record value to interpret.
 * @returns The interpreted address bytes as hex or null if deleted.
 */
export function interpretAddressRecordValue(value: Hex): Hex | null {
  // interpret empty bytes as deletion of address record
  if (value === "0x") return null;

  // interpret malformed hex as non-existence of address record
  if (!isHex(value, { strict: true })) return null;

  // normalize to lowercase
  const normalized = value.toLowerCase() as Hex;

  // interpret zeroAddress as deletion
  // NOTE: direct string compare is ok here because both zeroAddress and `normalized` are
  // normalized to lowercase 0x-prefixed hex strings
  if (normalized === zeroAddress) return null;

  // otherwise return the address record bytes as-is
  return normalized;
}

/**
 * Interprets a text record key string and returns null if the key should be ignored.
 *
 * The interpreted text record key is either:
 * a) null, representing a text record key that should be ignored, or
 *   i. contains null bytes
 *   ii. empty string
 * b) a text record key that
 *   i. does not contain null bytes
 *
 * @param value - The text record key to interpret.
 * @returns The interpreted text string or null if ignored.
 */
export function interpretTextRecordKey(key: string): string | null {
  // TODO(null-bytes): store null bytes correctly — for now, ignore
  if (hasNullByte(key)) return null;

  // ignore empty-string keys
  if (key === "") return null;

  // otherwise return the key as-is
  return key;
}

/**
 * Interprets a text record value string and returns null if the value is interpreted as a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existent or deletion of the record, or
 *   i. contains null bytes
 *   ii. empty string
 * b) a text record value that
 *   i. does not contain null bytes
 *
 * @param value - The text record value to interpret.
 * @returns The interpreted text string or null if deleted.
 */
export function interpretTextRecordValue(value: string): string | null {
  // TODO(null-bytes): store null bytes correctly — for now, interpret as deletion
  if (hasNullByte(value)) return null;

  // interpret empty string as deletion of a text record
  if (value === "") return null;

  // otherwise return the string as-is
  return value;
}
