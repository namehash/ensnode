import type { AccountIdString } from "./shared";

/**
 * An ID that uniquely identifies a concrete ENSv1 Registry contract.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ENSv1RegistryId = AccountIdString & { __brand: "ENSv1RegistryId" };

/**
 * An ID that uniquely identifies an ENSv2 Registry contract.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ENSv2RegistryId = AccountIdString & { __brand: "ENSv2RegistryId" };

/**
 * An ID that uniquely identifies an ENSv1 Virtual Registry — a virtual registry managed by an
 * ENSv1 domain that has children.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
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
 * An ID that uniquely identifies an ENSv1 Domain.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ENSv1DomainId = string & { __brand: "ENSv1DomainId" };

/**
 * An ID that uniquely identifies an ENSv2 Domain.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ENSv2DomainId = string & { __brand: "ENSv2DomainId" };

/**
 * A DomainId is one of ENSv1DomainId or ENSv2DomainId.
 */
export type DomainId = ENSv1DomainId | ENSv2DomainId;

/**
 * An ID that uniquely identifies a Permissions entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type PermissionsId = AccountIdString & { __brand: "PermissionsId" };

/**
 * An ID that uniquely identifies a PermissionsResource entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type PermissionsResourceId = string & { __brand: "PermissionsResourceId" };

/**
 * An ID that uniquely identifies a PermissionsUser entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type PermissionsUserId = string & { __brand: "PermissionsUserId" };

/**
 * An ID that uniquely identifies a Resolver entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ResolverId = AccountIdString & { __brand: "ResolverId" };

/**
 * An ID that uniquely identifies a ResolverRecords entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type ResolverRecordsId = string & { __brand: "ResolverRecordsId" };

/**
 * An ID that uniquely identifies a Registration entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type RegistrationId = string & { __brand: "RegistrationId" };

/**
 * An ID that uniquely identifies a Renewal entity.
 *
 * @dev see packages/enssdk/src/lib/ids.ts for context
 */
export type RenewalId = string & { __brand: "RenewalId" };

/**
 * CanonicalPath is an ordered list of DomainIds describing the canonical path to a Domain.
 * It is ordered in namegraph TRAVERSAL order (i.e. the opposite order of an ENS Name's labels).
 */
export type CanonicalPath = DomainId[];
