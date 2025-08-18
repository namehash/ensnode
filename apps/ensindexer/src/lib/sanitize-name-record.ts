import { hasNullByte } from "@/lib/lib-helpers";
import { type Name, isNormalized } from "@ensnode/ensnode-sdk";

/**
 * Sanitizes values for the `name` record.
 *
 * Coalesces null or empty string to null.
 * If `value` contains NULL bytes, it is not a valid `name` record.
 * If `value` is not normalized, it is not a valid `name` record.
 */
export function sanitizeNameRecordValue(value: Name | null): Name | null {
  // handle null, empty string
  if (!value) return null;

  // TODO(null-bytes): represent null bytes correctly
  // for now, if contains null bytes, cannot be indexed and is not a valid `name` record value
  if (hasNullByte(value)) return null;

  // NOTE: if not normalized, is not valid `name` record value
  if (!isNormalized(value)) return null;

  return value;
}
