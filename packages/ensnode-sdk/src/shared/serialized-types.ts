import type { AccountId } from "./types";

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
 * String representation of {@link AccountId}.
 *
 * Formatted as a fully lowercase CAIP-10 AccountId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export type AccountIdString = string;

/**
 * String representation of {@link AssetId}.
 *
 * Formatted as a fully lowercase CAIP-19 AssetId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 * @example "eip155:1/erc721:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
 *          for vitalik.eth in the eth base registrar on mainnet.
 */
export type AssetIdString = string;
