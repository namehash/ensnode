import { AccountId as CaipAccountId } from "caip";

import type { Price, PriceEth, SerializedPrice, SerializedPriceEth } from "./currencies";
import type {
  ChainIdString,
  DatetimeISO8601,
  SerializedAccountId,
  UrlString,
} from "./serialized-types";
import type { AccountId, ChainId, Datetime } from "./types";

/**
 * Serializes a {@link ChainId} value into its string representation.
 */
export function serializeChainId(chainId: ChainId): ChainIdString {
  return chainId.toString();
}

/**
 * Serializes a {@link Datetime} value into its string representation.
 */
export function serializeDatetime(datetime: Datetime): DatetimeISO8601 {
  return datetime.toISOString();
}

/**
 * Serializes a {@link URL} value into its string representation.
 */
export function serializeUrl(url: URL): UrlString {
  return url.toString();
}

/**
 * Serializes a {@link Price} object.
 */
export function serializePrice(price: Price): SerializedPrice {
  return {
    currency: price.currency,
    amount: price.amount.toString(),
  };
}

/**
 * Serializes a {@link PriceEth} object.
 */
export function serializePriceEth(price: PriceEth): SerializedPriceEth {
  return serializePrice(price) as SerializedPriceEth;
}

/**
 * Serializes {@link AccountId} object.
 *
 * Formatted as a fully lowercase CAIP-10 AccountId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export function serializeAccountId(accountId: AccountId): SerializedAccountId {
  return CaipAccountId.format({
    chainId: { namespace: "eip155", reference: accountId.chainId.toString() },
    address: accountId.address,
  }).toLowerCase();
}
