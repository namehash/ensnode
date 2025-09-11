import { stripNullBytes } from "@/lib/lib-helpers";
import { Name, isNormalizedName } from "@ensnode/ensnode-sdk";
import { getAddress, isAddress, isAddressEqual, zeroAddress } from "viem";

/**
 * Interprets a name record value string and returns null if the value represents a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existant or deletion of the record, or
 * b) a normalized, non-empty-string Name.
 *
 * @param value - The name record value string to interpret.
 * @returns The interpreted name string, or null if deleted.
 */
export function interpretNameRecordValue(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, empty string is emitted when the user un-sets the record (this
  // is because the abi of this event is only capable of expressing string values, so empty string
  // canonically represents the non-existence or deletion of the record value)
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalizedName(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}

/**
 * Interprets an address record value string and returns null if the value represents a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existant or deletion of the record, or
 *   i. empty string
 *   ii. empty hex (0x)
 *   iii. zeroAddress
 * b) an address record value that
 *   i. does not contain null bytes
 *   ii. (if is an EVM address) is checksummed
 *
 * @param value - The address record value to interpret.
 * @returns The interpreted address string or null if deleted.
 */
export function interpretAddressRecordValue(value: string): string | null {
  // TODO(null-bytes): store null bytes correctly
  const sanitized = stripNullBytes(value);

  // interpret empty string as deletion of address record
  if (sanitized === "") return null;

  // interpret empty bytes as deletion of address record
  if (sanitized === "0x") return null;

  // if it's not an EVM address, return as-is
  if (!isAddress(sanitized)) return sanitized;

  // interpret zeroAddress as deletion
  if (isAddressEqual(sanitized, zeroAddress)) return null;

  // otherwise ensure checksummed
  return getAddress(sanitized);
}

/**
 * Interprets a text record value string and returns null if the value represents a deletion.
 *
 * The interpreted record value is either:
 * a) null, representing a non-existant or deletion of the record, or
 *   i. empty string
 * b) a text record value that
 *   i. does not contain null bytes
 *
 * @param value - The text record value to interpret.
 * @returns The interpreted text string or null if deleted.
 */
export function interpretTextRecordValue(value: string): string | null {
  // TODO(null-bytes): store null bytes correctly
  const sanitized = stripNullBytes(value);

  // interpret empty string as deletion of a text record
  if (sanitized === "") return null;

  // otherwise return the string as-is
  return sanitized;
}
