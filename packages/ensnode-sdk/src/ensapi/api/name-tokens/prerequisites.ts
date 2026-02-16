import { type EnsIndexerPublicConfig, PluginName } from "../../../ensindexer/config/types";
import {
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "../../../indexing-status/omnichain-indexing-status-snapshot";

export const nameTokensPrerequisites = Object.freeze({
  /**
   * Required plugins to enable Name Tokens API routes.
   *
   * 1. `registrars` plugin is required so that data in the `registrationLifecycles`
   *    table is populated.
   * 2. `tokenscope` plugin is required so that data in the `nameTokens`
   *    table is populated.
   */
  requiredPlugins: [PluginName.Registrars, PluginName.TokenScope] as const,

  /**
   * Check if provided ENSApiPublicConfig supports the Name Tokens API.
   */
  hasEnsIndexerConfigSupport(config: EnsIndexerPublicConfig): boolean {
    return nameTokensPrerequisites.requiredPlugins.every((plugin) =>
      config.plugins.includes(plugin),
    );
  },
  /**
   * Required Indexing Status IDs
   *
   * Database indexes are created by the time the omnichain indexing status
   * is either `completed` or `following`.
   */
  supportedIndexingStatusIds: [
    OmnichainIndexingStatusIds.Completed,
    OmnichainIndexingStatusIds.Following,
  ],

  /**
   * Check if provided indexing status supports the Name Tokens API.
   */
  hasIndexingStatusSupport(omnichainIndexingStatusId: OmnichainIndexingStatusId): boolean {
    return nameTokensPrerequisites.supportedIndexingStatusIds.some(
      (supportedIndexingStatusId) => supportedIndexingStatusId === omnichainIndexingStatusId,
    );
  },
});
