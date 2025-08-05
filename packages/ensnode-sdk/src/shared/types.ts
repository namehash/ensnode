/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a non-negative integer.
 **/
export type ChainId = number;

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = number;

/**
 * Datetime value
 */
export type Datetime = Date;

/**
 * Unix timestamp value
 *
 * Guaranteed to be an integer.
 */
export type UnixTimestamp = number;

/**
 * Represents a URL that is used for RPC endpoints.
 *
 * Invariants:
 * - The URL must be a valid URL (localhost urls are allowed)
 */
export type RpcUrl = URL;

/**
 * BlockRef
 *
 * Describes a block.
 *
 * We use parameter types to maintain fields layout and documentation across
 * the domain model and its serialized counterpart.
 */
export interface BlockRef {
  /** Block number (height) */
  number: BlockNumber;

  /** Block timestamp */
  timestamp: UnixTimestamp;
}

/**
 * Block range
 *
 * Represents a range of blocks
 */
export interface Blockrange<BlockType = BlockNumber> {
  /** Start block number */
  startBlock?: BlockType;

  /** End block number */
  endBlock?: BlockType;
}

/**
 * Duration
 *
 * Representing a duration in seconds.
 *
 * Guaranteed to be a non-negative integer.
 */
export type Duration = number;

/**
 * A PluginName is a unique id for a 'plugin': we use the notion of 'plugins' to describe bundles
 * of indexing logic.
 */
export enum PluginName {
  Subgraph = "subgraph",
  Basenames = "basenames",
  Lineanames = "lineanames",
  ThreeDNS = "threedns",
  ReverseResolvers = "reverse-resolvers",
  Referrals = "referrals",
}
