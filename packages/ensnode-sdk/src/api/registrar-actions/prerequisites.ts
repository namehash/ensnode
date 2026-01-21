import {
  type ChainIndexingConfigTypeId,
  ChainIndexingConfigTypeIds,
  type ENSIndexerPublicConfig,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  PluginName,
} from "../../ensindexer";

export type SupportedOmnichainIndexingStatusId =
  | typeof OmnichainIndexingStatusIds.Completed
  | typeof OmnichainIndexingStatusIds.Following;

export const registrarActionsPrerequisites = Object.freeze({
  /**
   * Required plugins to enable Registrar Actions API routes.
   *
   * 1. `registrars` plugin is required so that data in the `registrarActions`
   *    table is populated.
   * 2. `subgraph`, `basenames`, and `lineanames` are required to get the data
   *    for the name associated with each registrar action.
   * 3. In theory not all of `subgraph`, `basenames`, and `lineanames` plugins
   *    might be required. Ex: At least one, but the current logic in
   *    the `registrars` plugin always indexes registrar actions across
   *    Ethnames (subgraph), Basenames, and Lineanames and therefore we need to
   *    ensure each value in the registrar actions table has
   *    an associated record in the domains table.
   */
  requiredPlugins: [
    PluginName.Subgraph,
    PluginName.Basenames,
    PluginName.Lineanames,
    PluginName.Registrars,
  ] as const,

  /**
   * Gets the omnichain indexing status required to support
   * the Registrar Actions API for a given indexing config type.
   */
  getSupportedIndexingStatus(
    configType: ChainIndexingConfigTypeId,
  ): SupportedOmnichainIndexingStatusId {
    switch (configType) {
      case ChainIndexingConfigTypeIds.Definite:
        return OmnichainIndexingStatusIds.Completed;
      case ChainIndexingConfigTypeIds.Indefinite:
        return OmnichainIndexingStatusIds.Following;
    }
  },

  /**
   * Check if provided ENSApiPublicConfig supports the Registrar Actions API.
   */
  hasEnsIndexerConfigSupport(config: ENSIndexerPublicConfig): boolean {
    return registrarActionsPrerequisites.requiredPlugins.every((plugin) =>
      config.plugins.includes(plugin),
    );
  },

  /**
   * Check if provided indexing status supports the Registrar Actions API, given
   * the indexing config type.
   */
  hasIndexingStatusSupport(
    configType: ChainIndexingConfigTypeId,
    omnichainIndexingStatusId: OmnichainIndexingStatusId,
  ): boolean {
    return (
      registrarActionsPrerequisites.getSupportedIndexingStatus(configType) ===
      omnichainIndexingStatusId
    );
  },
});
