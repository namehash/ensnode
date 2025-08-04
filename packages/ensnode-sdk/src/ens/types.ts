import type { Hex } from "viem";

// re-export CoinType and EvmCoinType from @ensdomains/address-encoder so consumers don't need it as
// a dependency
export type { CoinType, EvmCoinType } from "@ensdomains/address-encoder";

/**
 * ENSNamespaceIds encodes the set of identifiers for well-known ENS namespaces.
 *
 * Each ENS namespace is a single, unified set of ENS names with a distinct onchain root
 * Registry (the ensroot Datasource) and the capability of spanning from that root Registry across
 * other `Datasource`s that may be distributed across multiple chains and offchain resources.
 *
 * For example, as of 9-Feb-2025 the canonical ENS namespace on mainnet includes:
 * - A root Registry on mainnet.
 * - An onchain Registrar for direct subnames of 'eth' on mainnet.
 * - An onchain Registry and Registrar for direct subnames of 'base.eth' on Base.
 * - An onchain Registry and Registrar subregistry for direct subnames of 'linea.eth' on Linea.
 * - An offchain subregistry for subnames of '.cb.id'.
 * - An offchain subregistry for subnames of '.uni.eth'.
 * - Etc..
 *
 * Each ENS namespace is logically independent of & isolated from the others, and not exclusively
 * correlated with a specific L1 chain. For example, the Sepolia and Holesky testnet ENS namespaces
 * are independent of the canonical ENS namespace on mainnet, and there could be an additional
 * deployment of the ENS protocol to mainnet, configured with different Datasources, resulting in a
 * logically isolated set of ENS names.
 *
 * 'ens-test-env' represents an ENS namespace running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export const ENSNamespaceIds = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Holesky: "holesky",
  EnsTestEnv: "ens-test-env",
} as const;

/**
 * ENSNamespaceId is the derived string union of possible ENS namespace identifiers.
 */
export type ENSNamespaceId = (typeof ENSNamespaceIds)[keyof typeof ENSNamespaceIds];

/**
 * A hash value that uniquely identifies a single ENS name.
 * Result of `namehash` function as specified in ENSIP-1.
 *
 * @example
 * ```
 * namehash("vitalik.eth") === "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"
 * ```
 * @link https://docs.ens.domains/ensip/1#namehash-algorithm
 */
export type Node = Hex;

/**
 * A Name represents a human-readable ENS name.
 *
 * ex: vitalik.eth
 */
export type Name = string;

/**
 * A LabelHash is the result of the labelhash function (which is just keccak256) on a Label.
 *
 * @link https://docs.ens.domains/terminology#labelhash
 */
export type LabelHash = Hex;

/**
 * A Label is a single part of an ENS Name.
 *
 * @link https://docs.ens.domains/terminology#label
 */
export type Label = string;

/**
 * An EncodedLabelHash is a specially formatted unnormalized Label that should be interpreted as a
 * LabelHash literal, particularly for use within an ENS Name.
 *
 * @example [abcd]
 * @example [abcd].example.eth
 */
export type EncodedLabelHash = `[${string}]`;
