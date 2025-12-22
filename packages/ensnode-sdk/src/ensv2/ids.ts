import type { AccountIdString, Node } from "@ensnode/ensnode-sdk";

/**
 * Serialized CAIP-10 Asset ID that uniquely identifies a Registry contract.
 */
export type RegistryId = string & { __brand: "RegistryContractId" };

/**
 * A Domain's Canonical Id is uint256(labelHash) with lower (right-most) 32 bits zero'd.
 */
export type CanonicalId = bigint;

/**
 * The node that uniquely identifies an ENSv1 name.
 */
export type ENSv1DomainId = Node & { __brand: "ENSv1DomainId" };

/**
 * The Serialized CAIP-19 Asset ID that uniquely identifies an ENSv2 name.
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
