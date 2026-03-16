import { type Address, hexToBigInt } from "viem";

import {
  type AccountId,
  AssetNamespaces,
  formatAccountId,
  formatAssetId,
  type LabelHash,
  type Node,
} from "@ensnode/ensnode-sdk";

import type {
  CanonicalId,
  DomainId,
  ENSv1DomainId,
  ENSv2DomainId,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  RenewalId,
  ResolverId,
  ResolverRecordsId,
} from "./ids";

/**
 * Formats and brands an AccountId as a RegistryId.
 */
export const makeRegistryId = (accountId: AccountId) => formatAccountId(accountId) as RegistryId;

/**
 * Makes an ENSv1 Domain Id given the ENSv1 Domain's `node`
 */
export const makeENSv1DomainId = (node: Node) => node as ENSv1DomainId;

/**
 * Makes an ENSv2 Domain Id given the parent `registry` and the domain's `canonicalId`.
 */
export const makeENSv2DomainId = (registry: AccountId, canonicalId: CanonicalId) =>
  formatAssetId({
    assetNamespace: AssetNamespaces.ERC1155,
    contract: registry,
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
 * Formats and brands an AccountId as a PermissionsId.
 */
export const makePermissionsId = (contract: AccountId) =>
  formatAccountId(contract) as PermissionsId;

/**
 * Constructs a PermissionsResourceId for a given `contract`'s `resource`.
 */
export const makePermissionsResourceId = (contract: AccountId, resource: bigint) =>
  `${makePermissionsId(contract)}/${resource}` as PermissionsResourceId;

/**
 * Constructs a PermissionsUserId for a given `contract`'s `resource`'s `user`.
 */
export const makePermissionsUserId = (contract: AccountId, resource: bigint, user: Address) =>
  `${makePermissionsId(contract)}/${resource}/${user}` as PermissionsUserId;

/**
 * Formats and brands an AccountId as a ResolverId.
 */
export const makeResolverId = (contract: AccountId) => formatAccountId(contract) as ResolverId;

/**
 * Constructs a ResolverRecordsId for a given `node` under `resolver`.
 */
export const makeResolverRecordsId = (resolver: AccountId, node: Node) =>
  `${makeResolverId(resolver)}/${node}` as ResolverRecordsId;

/**
 * Constructs a RegistrationId for a `domainId`'s `index`'thd Registration.
 */
export const makeRegistrationId = (domainId: DomainId, index: number) =>
  `${domainId}/${index}` as RegistrationId;

/**
 * Constructs a RenewalId for a `domainId`'s `registrationIndex`thd Registration's `index`'thd Renewal.
 */
export const makeRenewalId = (domainId: DomainId, registrationIndex: number, index: number) =>
  `${makeRegistrationId(domainId, registrationIndex)}/${index}` as RenewalId;
