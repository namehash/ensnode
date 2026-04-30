import { hexToBigInt } from "viem";

import { zeroLower32Bits } from "../_lib/zeroLower32Bits";
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

/**
 * Id format — dash-delimited tuples (perf trade-off, see #2016).
 *
 * Every composite id in this module joins its components with `-` rather than the canonical
 * CAIP-style mixed `:` / `/` delimiters. This is so that Ponder's indexing-cache profile-pattern
 * matcher can decompose the id into its parts (chainId, address, node, ...) and derive each
 * segment from event args (`event.chain.id`, `event.event.log.address`, `event.event.args.*`),
 * which is what enables prefetch on hot tables (Domain, Registry, Resolver, etc.). Under
 * CAIP-shaped ids the matcher's single-level string-delimiter split can't decompose a mixed
 * `:` / `/` payload, so prefetch silently never fires.
 *
 * Move back to CAIP-style ids once Ponder's matcher supports parsing CAIP-shaped composite
 * primary keys directly. This is a temporary shape, not the long-term one.
 *
 * Note that because we key ENSv2 Domains by StorageId (necessary for stable identifier over time,
 * since its backing tokenId can change), which is _derived_ from the emitted arguments, ENSv2 Domains
 * aren't currently prefetchable, and likely won't be without a feature from Ponder that allows
 * consumers to specify the prefetch key generation per-entity.
 */
const _stringifyAccountId = ({ chainId, address }: AccountId) =>
  [chainId, address.toLowerCase()].join("-");

export const makeENSv1RegistryId = (accountId: AccountId) =>
  _stringifyAccountId(accountId) as ENSv1RegistryId;

export const makeENSv2RegistryId = (accountId: AccountId) =>
  _stringifyAccountId(accountId) as ENSv2RegistryId;

export const makeENSv1VirtualRegistryId = (accountId: AccountId, node: Node) =>
  [_stringifyAccountId(accountId), node].join("-") as ENSv1VirtualRegistryId;

/**
 * Stringifies an {@link AccountId} as the id of a concrete Registry — either an
 * {@link ENSv1RegistryId} or an {@link ENSv2RegistryId}, but never an
 * {@link ENSv1VirtualRegistryId}.
 */
export const makeConcreteRegistryId = (accountId: AccountId) =>
  _stringifyAccountId(accountId) as ENSv1RegistryId | ENSv2RegistryId;

export const makeResolverId = (contract: AccountId) => _stringifyAccountId(contract) as ResolverId;

export const makeENSv1DomainId = (accountId: AccountId, node: Node) =>
  [_stringifyAccountId(accountId), node].join("-") as ENSv1DomainId;

export const makeENSv2DomainId = (registry: AccountId, storageId: StorageId) =>
  [_stringifyAccountId(registry), storageId.toString()].join("-") as ENSv2DomainId;

/**
 * Computes a Label's {@link StorageId} given its TokenId or LabelHash.
 */
export const makeStorageId = (tokenIdOrLabelHash: TokenId | LabelHash): StorageId => {
  const tokenId =
    typeof tokenIdOrLabelHash === "bigint" //
      ? tokenIdOrLabelHash
      : hexToBigInt(tokenIdOrLabelHash);

  return zeroLower32Bits(tokenId) as StorageId;
};

export const makePermissionsId = (contract: AccountId) =>
  _stringifyAccountId(contract) as PermissionsId;

export const makePermissionsResourceId = (contract: AccountId, resource: EACResource) =>
  [makePermissionsId(contract), resource].join("-") as PermissionsResourceId;

export const makePermissionsUserId = (
  contract: AccountId,
  resource: EACResource,
  user: NormalizedAddress,
) => [makePermissionsResourceId(contract, resource), user].join("-") as PermissionsUserId;

export const makeResolverRecordsId = (resolver: AccountId, node: Node) =>
  [makeResolverId(resolver), node].join("-") as ResolverRecordsId;

export const makeRegistrationId = (domainId: DomainId, registrationIndex: number) =>
  [domainId, registrationIndex].join("-") as RegistrationId;

export const makeRenewalId = (domainId: DomainId, registrationIndex: number, index: number) =>
  [makeRegistrationId(domainId, registrationIndex), index].join("-") as RenewalId;
