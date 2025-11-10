import { hexToBigInt } from "viem";

import {
  type AccountId,
  type LabelHash,
  serializeAccountId,
  serializeAssetId,
} from "@ensnode/ensnode-sdk";

import type { CanonicalId, ENSv2DomainId, RegistryContractId } from "./ids";

/**
 * Serializes and brands an AccountId as a RegistryId.
 */
export const makeRegistryContractId = (accountId: AccountId) =>
  serializeAccountId(accountId) as RegistryContractId;

/**
 * Makes an ENSv2 Domain Id given the parent `registry` and the domain's `canonicalId`.
 */
export const makeENSv2DomainId = (registry: AccountId, canonicalId: CanonicalId) =>
  serializeAssetId({
    ...registry,
    tokenId: canonicalId,
  }) as ENSv2DomainId;

/**
 * Masks the lower 32 bits of `num`.
 */
const maskLower32Bits = (num: bigint) => num ^ (num & 0xffffffffn);

/**
 * Computes a Domain's {@link CanonicalId} given its tokenId or LabelHash as `input`.
 */
export const getCanonicalId = (input: bigint | LabelHash): CanonicalId => {
  if (typeof input === "bigint") return maskLower32Bits(input);
  return getCanonicalId(hexToBigInt(input));
};
