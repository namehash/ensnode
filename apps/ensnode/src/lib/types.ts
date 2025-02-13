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
 * In this project we use the notion of 'plugins' to describe which registries and subregistries
 * of a given ENS deployment are being indexed by ponder. In this project, a plugin's name is the
 * name of the subregistry it indexes. Note that this type definition is 1:1 with that of
 * @namehash/ens-deployments SubregistryName, simplifying the relationship between an ENSDeploymentConfig
 * and the plugins in this project.
 */
export type PluginName = "eth" | "base" | "linea";
