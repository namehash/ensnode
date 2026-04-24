import type { Hex } from "./evm";

/**
 * ABI content type per ENSIP-4.
 *
 * Single-bit values (1=JSON, 2=zlib-JSON, 4=CBOR, 8=URI) identify a stored ABI encoding.
 * `setABI` requires a power-of-2 value.
 *
 * Bitmask unions of those bits are used when reading via `ABI(node, contentTypes)`; the
 * resolver returns the first stored ABI whose bit is present in the mask (lowest bit first).
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/91c966febd7b55494269df830fc6775f040b927b/contracts/resolvers/profiles/ABIResolver.sol
 */
export type ContentType = bigint;

/**
 * ERC-165 4-byte interface selector.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/91c966febd7b55494269df830fc6775f040b927b/contracts/resolvers/profiles/InterfaceResolver.sol
 */
export type InterfaceId = Hex;

/**
 * IVersionableResolver record version. Bumped by `VersionChanged`, which invalidates all prior
 * records for the node.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/91c966febd7b55494269df830fc6775f040b927b/contracts/resolvers/profiles/IVersionableResolver.sol
 */
export type RecordVersion = bigint;
