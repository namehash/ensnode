import { AccountId as CaipAccountId, AssetId as CaipAssetId } from "caip";

import { uint256ToHex32 } from "../ens";
import type {
  Price,
  PriceDai,
  PriceEth,
  PriceUsdc,
  SerializedPrice,
  SerializedPriceDai,
  SerializedPriceEth,
  SerializedPriceUsdc,
} from "./currencies";
import type {
  AccountIdString,
  AssetIdString,
  ChainIdString,
  DatetimeISO8601,
  UrlString,
} from "./serialized-types";
import type { AccountId, AssetId, ChainId, Datetime } from "./types";

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
 * Format {@link AccountId} object as a string.
 *
 * Formatted as a fully lowercase CAIP-10 AccountId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export function formatAccountId(accountId: AccountId): AccountIdString {
  return CaipAccountId.format({
    chainId: { namespace: "eip155", reference: accountId.chainId.toString() },
    address: accountId.address,
  }).toLowerCase();
}

/**
 * Format {@link AssetId} object as a string.
 *
 * Formatted as a fully lowercase CAIP-19 AssetId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 */
export function formatAssetId({
  assetNamespace,
  contract: { chainId, address },
  tokenId,
}: AssetId): AssetIdString {
  return CaipAssetId.format({
    chainId: { namespace: "eip155", reference: chainId.toString() },
    assetName: { namespace: assetNamespace, reference: address },
    tokenId: uint256ToHex32(tokenId),
  }).toLowerCase();
}
