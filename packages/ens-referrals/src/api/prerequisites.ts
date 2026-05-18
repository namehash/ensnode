import {
  type EnsIndexerPublicConfig,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  PluginName,
  type PrerequisiteResult,
} from "@ensnode/ensnode-sdk";

/**
 * Required plugins to enable the ENSAnalytics API routes.
 *
 * 1. `registrars` plugin is required so that data in the `registrarActions`
 *    and `registrationLifecycles` tables is populated.
 * 2. `subgraph`, `basenames`, and `lineanames` are required so that data in
 *    the `subgraph_domain` table is populated for the names associated with
 *    each registrar action — read to look up `name` for each row.
 *
 * Each ENSAnalytics edition is scoped to a single `subregistryId`, so any one
 * edition only joins against rows from its own namespace's `subgraph_domain`.
 * In theory not all of `subgraph` / `basenames` / `lineanames` are required
 * for any single edition. In practice we require all three so that no edition
 * configuration can silently miss data because its namespace plugin was not
 * activated. This matches the precedent set by the Registrar Actions API
 * (`hasRegistrarActionsConfigSupport`).
 */
const ensAnalyticsRequiredPlugins = [
  PluginName.Subgraph,
  PluginName.Basenames,
  PluginName.Lineanames,
  PluginName.Registrars,
] as const;

/**
 * Check if provided EnsIndexerPublicConfig supports the ENSAnalytics API.
 */
export function hasEnsAnalyticsConfigSupport(config: EnsIndexerPublicConfig): PrerequisiteResult {
  const supported = ensAnalyticsRequiredPlugins.every((plugin) => config.plugins.includes(plugin));
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The ENSAnalytics API requires all of the following plugins to be activated in the connected ENSNode's Config: ${ensAnalyticsRequiredPlugins.map((plugin) => `'${plugin}'`).join(", ")}.`,
  };
}

/**
 * Required Indexing Status IDs
 *
 * Database indexes are created by the time the omnichain indexing status
 * is either `completed` or `following`.
 */
const ensAnalyticsSupportedIndexingStatusIds = [
  OmnichainIndexingStatusIds.Completed,
  OmnichainIndexingStatusIds.Following,
];

/**
 * Check if provided indexing status supports the ENSAnalytics API.
 */
export function hasEnsAnalyticsIndexingStatusSupport(
  omnichainIndexingStatusId: OmnichainIndexingStatusId,
): PrerequisiteResult {
  const supported = ensAnalyticsSupportedIndexingStatusIds.some(
    (supportedIndexingStatusId) => supportedIndexingStatusId === omnichainIndexingStatusId,
  );
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The ENSAnalytics API requires the connected ENSNode's Indexing Status to be one of the following: ${ensAnalyticsSupportedIndexingStatusIds.join(", ")}.`,
  };
}
