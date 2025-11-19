import type { Node, SerializedAccountId } from "@ensnode/ensnode-sdk";

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
 *
 */
export type PermissionsId = SerializedAccountId & { __brand: "PermissionsId" };

/**
 *
 */
export type PermissionsResourceId = string & { __brand: "PermissionsResourceId" };

/**
 *
 */
export type PermissionsUserId = string & { __brand: "PermissionsUserId" };

/**
 *
 */
export type ResolverId = SerializedAccountId & { __brand: "ResolverId" };

/**
 *
 */
export type ResolverRecordsId = string & { __brand: "ResolverRecordsId" };

/**
 *
 */
export type RegistrationId = string & { __brand: "RegistrationId" };
