import type { AccountIdString } from "./shared";

/**
 * Serialized CAIP-10 Asset ID that uniquely identifies a concrete ENSv1 Registry contract.
 */
export type ENSv1RegistryId = AccountIdString & { __brand: "ENSv1RegistryId" };

/**
 * Serialized CAIP-10 Asset ID that uniquely identifies an ENSv2 Registry contract.
 */
export type ENSv2RegistryId = AccountIdString & { __brand: "ENSv2RegistryId" };

/**
 * Uniquely identifies an ENSv1 Virtual Registry — a virtual registry managed by an ENSv1 domain
 * that has children. Shape: `${ENSv1RegistryId}/${node}`, where `(chainId, address)` from the
 * ENSv1RegistryId is the concrete Registry that housed the parent domain, and `node` is the
 * parent's namehash.
 */
export type ENSv1VirtualRegistryId = string & { __brand: "ENSv1VirtualRegistryId" };

/**
 * A RegistryId is one of ENSv1RegistryId, ENSv1VirtualRegistryId, or ENSv2RegistryId.
 */
export type RegistryId = ENSv1RegistryId | ENSv1VirtualRegistryId | ENSv2RegistryId;

/**
 * A Label's Storage Id is uint256(labelHash) with lower (right-most) 32 bits zero'd.
 *
 * In ENSv2, the rightmost 32 bits of a TokenId is used for version management, and it is the leftmost
 * 224 bits that are a stable identifier for a Label within a Registry.
 */
export type StorageId = bigint & { __brand: "StorageId" };

/**
 * Uniquely identifies an ENSv1 Domain. Shape: `${ENSv1RegistryId}/${node}`.
 *
 * Same shape as {@link ENSv1VirtualRegistryId} (registry + node), but distinct entity kinds living
 * in distinct tables.
 */
export type ENSv1DomainId = string & { __brand: "ENSv1DomainId" };

/**
 * The Serialized CAIP-19 Asset ID (using Storage Id instead of TokenId) that uniquely identifies
 * an ENSv2 name.
 */
export type ENSv2DomainId = string & { __brand: "ENSv2DomainId" };

/**
 * A DomainId is one of ENSv1DomainId or ENSv2DomainId.
 */
export type DomainId = ENSv1DomainId | ENSv2DomainId;

/**
 * Uniquely identifies a Permissions entity.
 */
export type PermissionsId = AccountIdString & { __brand: "PermissionsId" };

/**
 * Uniquely identifies a PermissionsResource entity.
 */
export type PermissionsResourceId = string & { __brand: "PermissionsResourceId" };

/**
 * Uniquely identifies a PermissionsUser entity.
 */
export type PermissionsUserId = string & { __brand: "PermissionsUserId" };

/**
 * Uniquely identifies a Resolver entity.
 */
export type ResolverId = AccountIdString & { __brand: "ResolverId" };

/**
 * Uniquely identifies a ResolverRecords entity.
 */
export type ResolverRecordsId = string & { __brand: "ResolverRecordsId" };

/**
 * Uniquely identifies a Registration entity.
 */
export type RegistrationId = string & { __brand: "RegistrationId" };

/**
 * Uniquely identifies a Renewal entity.
 */
export type RenewalId = string & { __brand: "RenewalId" };

/**
 * CanonicalPath is an ordered list of DomainIds describing the canonical path to a Domain.
 * It is ordered in namegraph TRAVERSAL order (i.e. the opposite order of an ENS Name's labels).
 */
export type CanonicalPath = DomainId[];
