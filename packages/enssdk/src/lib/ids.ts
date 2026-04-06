import { type Address, hexToBigInt } from "viem";

import { zeroLower32Bits } from "../_lib/zeroLower32Bits";
import { stringifyAccountId, stringifyAssetId } from "./caip";
import type {
  AccountId,
  DomainId,
  EACResource,
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
  TokenId,
} from "./types";
import { AssetNamespaces } from "./types";

export const makeRegistryId = (accountId: AccountId) => stringifyAccountId(accountId) as RegistryId;

export const makeResolverId = (contract: AccountId) => stringifyAccountId(contract) as ResolverId;

export const makeENSv1DomainId = (node: Node) => node as ENSv1DomainId;

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

export const makePermissionsUserId = (contract: AccountId, resource: EACResource, user: Address) =>
  `${makePermissionsResourceId(contract, resource)}/${user}` as PermissionsUserId;

export const makeResolverRecordsId = (resolver: AccountId, node: Node) =>
  `${makeResolverId(resolver)}/${node}` as ResolverRecordsId;

export const makeRegistrationId = (domainId: DomainId, registrationIndex: number) =>
  `${domainId}/${registrationIndex}` as RegistrationId;

export const makeRenewalId = (domainId: DomainId, registrationIndex: number, index: number) =>
  `${makeRegistrationId(domainId, registrationIndex)}/${index}` as RenewalId;
