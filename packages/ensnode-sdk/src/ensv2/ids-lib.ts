import { type Address, hexToBigInt } from "viem";

import {
  type AccountId,
  type LabelHash,
  serializeAccountId,
  serializeAssetId,
} from "@ensnode/ensnode-sdk";

import type {
  CanonicalId,
  ENSv2DomainId,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistryContractId,
  ResolverId,
} from "./ids";

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

/**
 * Serializes and brands an AccountId as a PermissionsId.
 */
export const makePermissionsId = (contract: AccountId) =>
  serializeAccountId(contract) as PermissionsId;

/**
 *
 */
export const makePermissionsResourceId = (contract: AccountId, resource: bigint) =>
  `${serializeAccountId(contract)}/${resource}` as PermissionsResourceId;

/**
 *
 */
export const makePermissionsUserId = (contract: AccountId, resource: bigint, user: Address) =>
  `${serializeAccountId(contract)}/${resource}/${user}` as PermissionsUserId;

/**
 * Serializes and brands an AccountId as a ResolverId.
 */
export const makeResolverId = (contract: AccountId) => serializeAccountId(contract) as ResolverId;
