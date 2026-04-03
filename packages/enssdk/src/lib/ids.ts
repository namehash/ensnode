import { AccountId as CaipAccountId, AssetId as CaipAssetId } from "caip";
import { type Address, type Hex, hexToBigInt, toHex } from "viem";

import type {
  AccountId,
  AccountIdString,
  AssetId,
  AssetIdString,
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
 * Stringify an {@link AccountId} as a fully lowercase CAIP-10 AccountId string.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export function stringifyAccountId(accountId: AccountId): AccountIdString {
  return CaipAccountId.format({
    chainId: { namespace: "eip155", reference: accountId.chainId.toString() },
    address: accountId.address,
  }).toLowerCase();
}

/**
 * Stringify an {@link AssetId} as a fully lowercase CAIP-19 AssetId string.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 */
export function stringifyAssetId({
  assetNamespace,
  contract: { chainId, address },
  tokenId,
}: AssetId): AssetIdString {
  const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });

  return CaipAssetId.format({
    chainId: { namespace: "eip155", reference: chainId.toString() },
    assetName: { namespace: assetNamespace, reference: address },
    tokenId: uint256ToHex32(tokenId),
  }).toLowerCase();
}

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
 * Masks the lower 32 bits of `num`.
 */
const maskLower32Bits = (num: bigint) => num ^ (num & 0xffffffffn);

/**
 * Computes a Label's {@link StorageId} given its tokenId or LabelHash as `input`.
 */
export const getStorageId = (input: bigint | LabelHash): StorageId => {
  if (typeof input === "bigint") return maskLower32Bits(input);
  return getStorageId(hexToBigInt(input));
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
