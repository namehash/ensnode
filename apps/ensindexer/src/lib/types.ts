/**
 * An owned name for a plugin. Must end with `eth`.
 *
 * Owned names are used to distinguish between plugins that handle different
 * subnames. For example, a plugin that handles `eth` subnames will have an
 * owned name of `eth`, while a plugin that handles `base.eth` subnames will
 * have an owned name of `base.eth`.
 */
export type OwnedName = string;

/**
 * In ENSIndexer we use the notion of 'plugins' to describe a relationship between a set of contracts
 * and the handler logic that indexes their events. For ENSv1, a plugin's name is the
 * name of the subregistry it indexes ('eth', 'base', 'linea').
 *
 * The ENSv2 plugin ('ens-v2') represents the configuration and indexing logic associated with
 * indexing ENSv2.
 *
 * The PluginName type is necessary for uniquely identifying each plugin's config and filtering
 * which are 'activated' at runtime.
 *
 * Note that this type is an exact equivalent of `keyof ENSDeploymentConfig`, which we over-specify
 * to illustrate the connection between a ENSIndexer plugin and the AddressBook that it is configured
 * with.
 */
export type PluginName = "eth" | "base" | "linea" | "ens-v2";
