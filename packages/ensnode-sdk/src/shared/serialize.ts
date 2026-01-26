import { AccountId as CaipAccountId, AssetId as CaipAssetId } from "caip";
import { type Hex, toHex } from "viem";

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
 * Encodes a uint256 bigint as hex string sized to 32 bytes.
 * Uses include, in the context of ENS, decoding the uint256-encoded tokenId of NFT-issuing contracts
 * into Node or LabelHash, which is a common behavior in the ENS ecosystem.
 * (see NameWrapper, ETHRegistrarController)
 *
 * @remarks
 * This is an inline copy of the function from `../ens/subname-helpers.ts` to avoid
 * cross-module imports that cause Vite SSR module resolution issues. When Vitest loads
 * TypeScript sources in a pnpm workspace, importing from ../ens creates a complex module
 * graph that Vite SSR cannot properly resolve, resulting in imported functions appearing
 * as undefined at runtime.
 */
const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });

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
