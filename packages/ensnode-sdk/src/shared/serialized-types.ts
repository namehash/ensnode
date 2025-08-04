import type { BlockRef, ChainId } from "./types";

/**
 * A string representation of {@link ChainId}.
 **/
export type ChainIdString = string;

/**
 * Datetime value following the ISO 8601 standard.
 *
 * @see https://www.iso.org/iso-8601-date-and-time-format.html
 */
export type DatetimeIso8601 = string;

/**
 * A string representation of a {@link URL}.
 */
export type UrlString = string;

/**
 * Serialized representation of {@link BlockRef}
 */
export type SerializedBlockRef = BlockRef<DatetimeIso8601>;
