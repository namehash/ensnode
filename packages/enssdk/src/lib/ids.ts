import { type Address, hexToBigInt } from "viem";

import { stringifyAccountId, stringifyAssetId } from "./caip";
import type {
  AccountId,
  DomainId,
  ENSv1DomainId,
  ENSv2DomainId,
  LabelHash,
  Node,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  RenewalId,
  ResolverId,
  ResolverRecordsId,
  StorageId,
} from "./types";
import { AssetNamespaces } from "./types";

/**
 * Masks the lower 32 bits of `num`.
 */
const maskLower32Bits = (num: bigint) => num ^ (num & 0xffffffffn);

export const makeRegistryId = (accountId: AccountId) => stringifyAccountId(accountId) as RegistryId;

export const makePermissionsId = (contract: AccountId) =>
  stringifyAccountId(contract) as PermissionsId;

export const makeResolverId = (contract: AccountId) => stringifyAccountId(contract) as ResolverId;

export const makeENSv1DomainId = (node: Node) => node as ENSv1DomainId;

export const makeENSv2DomainId = (registry: AccountId, storageId: StorageId) =>
  stringifyAssetId({
    assetNamespace: AssetNamespaces.ERC1155,
    contract: registry,
    tokenId: storageId,
  }) as ENSv2DomainId;

/**
 * Computes a Label's {@link StorageId} given its tokenId or LabelHash as `input`.
 */
export const makeStorageId = (input: bigint | LabelHash): StorageId => {
  if (typeof input === "bigint") return maskLower32Bits(input);
  return makeStorageId(hexToBigInt(input));
};

export const makePermissionsResourceId = (contract: AccountId, resource: bigint) =>
  `${makePermissionsId(contract)}/${resource}` as PermissionsResourceId;

export const makePermissionsUserId = (contract: AccountId, resource: bigint, user: Address) =>
  `${makePermissionsId(contract)}/${resource}/${user}` as PermissionsUserId;

export const makeResolverRecordsId = (resolver: AccountId, node: Node) =>
  `${makeResolverId(resolver)}/${node}` as ResolverRecordsId;

export const makeRegistrationId = (domainId: DomainId, index: number) =>
  `${domainId}/${index}` as RegistrationId;

export const makeRenewalId = (domainId: DomainId, registrationIndex: number, index: number) =>
  `${makeRegistrationId(domainId, registrationIndex)}/${index}` as RenewalId;
