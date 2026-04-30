import type { ChainId, ChainIdString, DatetimeISO8601, UrlString } from "enssdk";

import type {
  Price,
  PriceDai,
  PriceEns,
  PriceEth,
  PriceUsdc,
  SerializedPrice,
  SerializedPriceDai,
  SerializedPriceEns,
  SerializedPriceEth,
  SerializedPriceUsdc,
} from "./currencies";
import type { Datetime } from "./types";

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
 * Serializes a {@link PriceUsdc} object.
 */
export function serializePriceUsdc(price: PriceUsdc): SerializedPriceUsdc {
  return serializePrice(price) as SerializedPriceUsdc;
}

/**
 * Serializes a {@link PriceDai} object.
 */
export function serializePriceDai(price: PriceDai): SerializedPriceDai {
  return serializePrice(price) as SerializedPriceDai;
}

/**
 * Serializes a {@link PriceEns} object.
 */
export function serializePriceEns(price: PriceEns): SerializedPriceEns {
  return serializePrice(price) as SerializedPriceEns;
}
