import { AccountId } from "./types";

/**
 * Serialized representation of {@link ChainId}.
 **/
export type ChainIdString = string;

/**
 * Datetime value following the ISO 8601 standard.
 *
 * @see https://www.iso.org/iso-8601-date-and-time-format.html
 */
export type DatetimeISO8601 = string;

/**
 * Serialized representation of a {@link URL}.
 */
export type UrlString = string;

/**
 * Serialized representation of {@link AccountId}.
 *
 * Formatted as a fully lowercase CAIP-10 AccountId.
 */
export type SerializedAccountId = string;
