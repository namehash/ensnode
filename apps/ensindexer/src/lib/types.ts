/**
 * RegistrarManagedName is an explicit type representing the following concept:
 *   "the name a Registrar contract indexed by the shared handlers index subnames of"
 *
 * i.e. the basenames plugin uses the shared handlers to index the Basenames Registrar that indexes
 * subnames of "base.eth".
 *
 * Currently, the relationship between a plugin and a RegistrarManagedName is simplified to be 1:1.
 * In the future, we plan to enhance this data model to support indexing any number of Registrars
 * in a single plugin, which will be important for supporting 3DNS and other data sources.
 *
 * Additionally, our current implementation assumes data sources will share common indexing logic
 * (via our shared registrar indexing handlers). We will be working to support more expressive
 * or custom cases in the future, which will be necessary for 3DNS and other specialized integrations.
 */
export type RegistrarManagedName = string;

/*
 * The ENS Subgraph indexes events from a single chain and constructs event ids using just (blockNumber, logIndex).
 * Because ENSIndexer indexes multiple chains, however, these event ids can collide between chains,
 * if and when the blockNumber and logIndex happen to coincide across chains. To solve this, an
 * Event Id Prefix is provided by non-root plugins to the shared handlers in order to scope the event
 * ids created by the shared handlers and avoid said cross-chain collisions.
 *
 * `null` value implies no event id prefix (necessary for subgraph id generation compatibility)
 *
 * TODO: if we ever discard exact subgraph compatibility, we can use ponder's `event.id` as an event UUID.
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
