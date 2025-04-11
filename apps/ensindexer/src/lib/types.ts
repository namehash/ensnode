/**
 * RegistrarManagedName is an explicit type representing the following concept:
 *   "the name a registrar indexed by the shared handlers manages subnames of"
 *
 * i.e. the basenames plugin uses the shared handlers to index the Basenames Registrar that manages
 * subnames of "base.eth".
 */
export type RegistrarManagedName = string;

/*
 * The ENS Subgraph indexes events from a single network and constructs event ids using (blockNumber, logIndex).
 * Because ENSIndexer indexes multiple networks, however, event ids can collide between chains,
 * if the blockNumber and logIndex happen to line up.
 *
 * An Event Id Prefix is provided by non-root plugins to the shared handlers in order to scope the
 * event ids created by the shared handlers and avoid said cross-chain collisions.
 *
 * `null` value implies no event id prefix (necessary for subgraph id generation compatibility)
 *
 * TODO: if we ever discard exact subgraph compatbility, we can use ponder's `event.id` as an event UUID.
 */
export type EventIdPrefix = string | null;

/**
 * Describes a ponder-compatible blockrange with optional start and end blocks, minus 'latest' support.
 * An undefined start block indicates indexing from block 0, and undefined end block indicates
 * indexing in perpetuity (realtime).
 *
 * @docs https://ponder.sh/docs/contracts-and-networks#block-range
 * i.e. Pick<ContractConfig, 'startBlock' | 'endBlock'>
 */
export type Blockrange = { startBlock: number | undefined; endBlock: number | undefined };
