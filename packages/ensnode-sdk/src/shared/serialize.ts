import type {
  ChainIdString,
  DatetimeIso8601,
  SerializedBlockRef,
  UrlString,
} from "./serialized-types";
import type { BlockRef, ChainId, Datetime } from "./types";

/**
 * Serializes a {@link ChainId} value into its string representation.
 */
export function serializeChainId(chainId: ChainId): ChainIdString {
  return chainId.toString();
}

/**
 * Serializes a {@link Datetime} value into its string representation.
 */
export function serializeDatetime(datetime: Datetime): DatetimeIso8601 {
  return datetime.toISOString();
}

/**
 * Serializes a {@link URL} value into its string representation.
 */
export function serializeUrl(url: URL): UrlString {
  return url.toString();
}

/**
 * Serializes a {@link BlockRef} object.
 */
export function serializeBlockRef(blockRef: BlockRef): SerializedBlockRef {
  return {
    createdAt: serializeDatetime(blockRef.createdAt),
    number: blockRef.number,
  } satisfies SerializedBlockRef;
}
