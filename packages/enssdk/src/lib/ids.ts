import { hexToBigInt } from "viem";

import { zeroLower32Bits } from "../_lib/zeroLower32Bits";
import { stringifyAccountId, stringifyAssetId } from "./caip";
import type {
  AccountId,
  DomainId,
  EACResource,
  ENSv1DomainId,
  ENSv1RegistryId,
  ENSv1VirtualRegistryId,
  ENSv2DomainId,
  ENSv2RegistryId,
  LabelHash,
  Node,
  NormalizedAddress,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RenewalId,
  ResolverId,
  ResolverRecordsId,
  StorageId,
  TokenId,
} from "./types";
import { AssetNamespaces } from "./types";

export const makeENSv1RegistryId = (accountId: AccountId) =>
  stringifyAccountId(accountId) as ENSv1RegistryId;

export const makeENSv2RegistryId = (accountId: AccountId) =>
  stringifyAccountId(accountId) as ENSv2RegistryId;

export const makeENSv1VirtualRegistryId = (accountId: AccountId, node: Node) =>
  `${makeENSv1RegistryId(accountId)}/${node}` as ENSv1VirtualRegistryId;

/**
 * Stringifies an {@link AccountId} as the id of a concrete Registry — either an
 * {@link ENSv1RegistryId} or an {@link ENSv2RegistryId}, but never an
 * {@link ENSv1VirtualRegistryId}.
 */
export const makeConcreteRegistryId = (accountId: AccountId) =>
  stringifyAccountId(accountId) as ENSv1RegistryId | ENSv2RegistryId;

export const makeResolverId = (contract: AccountId) => stringifyAccountId(contract) as ResolverId;

export const makeENSv1DomainId = (accountId: AccountId, node: Node) =>
  `${makeENSv1RegistryId(accountId)}/${node}` as ENSv1DomainId;

export const makeENSv2DomainId = (registry: AccountId, storageId: StorageId) =>
  stringifyAssetId({
    assetNamespace: AssetNamespaces.ERC1155,
    contract: registry,
    tokenId: storageId,
  }) as ENSv2DomainId;

/**
 * Computes a Label's {@link StorageId} given its TokenId or LabelHash.
 */
export const makeStorageId = (labelRef: TokenId | LabelHash): StorageId => {
  if (typeof labelRef === "bigint") return zeroLower32Bits(labelRef) as StorageId;
  return zeroLower32Bits(hexToBigInt(labelRef)) as StorageId;
};

export const makePermissionsId = (contract: AccountId) =>
  stringifyAccountId(contract) as PermissionsId;

export const makePermissionsResourceId = (contract: AccountId, resource: EACResource) =>
  `${makePermissionsId(contract)}/${resource}` as PermissionsResourceId;

export const makePermissionsUserId = (
  contract: AccountId,
  resource: EACResource,
  user: NormalizedAddress,
) => `${makePermissionsResourceId(contract, resource)}/${user}` as PermissionsUserId;

export const makeResolverRecordsId = (resolver: AccountId, node: Node) =>
  `${makeResolverId(resolver)}/${node}` as ResolverRecordsId;

export const makeRegistrationId = (domainId: DomainId, registrationIndex: number) =>
  `${domainId}/${registrationIndex}` as RegistrationId;

export const makeRenewalId = (domainId: DomainId, registrationIndex: number, index: number) =>
  `${makeRegistrationId(domainId, registrationIndex)}/${index}` as RenewalId;
