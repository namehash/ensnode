/**
 * RegistrarManagedName is an explicit type representing this concept within the shared handlers:
 *   "the parent name a Registrar contract registers subnames of"
 *
 * ENSIndexer uses "shared handlers" for common indexing logic across plugins. While not suitable
 * for all theoretical ENS datasources, they work for current ones, particularly those that re-use the
 * original ENS contracts (i.e. Basenames, Linea Names). When indexing onchain events, these handlers
 * sometimes need context about parent ENS names of indexed subnames, which is what RegistrarManagedName
 * provides.
 *
 * ex: .eth for the ETH Registry
 * ex: .base.eth for Basenames Registry
 * ex: .linea.eth for the Linea Names Registry
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
 * if and when the blockNumber and logIndex happen to coincide across chains. To solve this (and
 * maintain subgraph compat), an EventIdPrefix is provided by non-root plugins to the shared handlers
 * in order to scope the event ids created by the shared handlers and avoid said cross-chain collisions.
 *
 * `null` value represents no EventIdPrefix (for subgraph compat in the "root" plugin)
 *
 * TODO: if we decide to relax exact subgraph backwards compatibility, we can simply use ponder's
 * `event.id` as an event UUID and remove this concept entirely.
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
