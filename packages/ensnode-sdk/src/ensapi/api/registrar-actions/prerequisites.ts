import { type EnsIndexerPublicConfig, PluginName } from "../../../ensindexer/config/types";
import {
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "../../../indexing-status/omnichain-indexing-status-snapshot";
import type { PrerequisiteResult } from "../../../shared/prerequisites";

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
const registrarActionsRequiredPlugins = [
  PluginName.Subgraph,
  PluginName.Basenames,
  PluginName.Lineanames,
  PluginName.Registrars,
] as const;

/**
 * Check if provided EnsIndexerPublicConfig supports the Registrar Actions API.
 */
export function hasRegistrarActionsConfigSupport(
  config: EnsIndexerPublicConfig,
): PrerequisiteResult {
  const supported = registrarActionsRequiredPlugins.every((plugin) =>
    config.plugins.includes(plugin),
  );
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The Registrar Actions API requires all of the following plugins to be activated in the connected ENSNode's Config: ${registrarActionsRequiredPlugins.map((plugin) => `'${plugin}'`).join(", ")}.`,
  };
}

/**
 * Required Indexing Status IDs
 *
 * Database indexes are created by the time the omnichain indexing status
 * is either `completed` or `following`.
 */
const registrarActionsSupportedIndexingStatusIds = [
  OmnichainIndexingStatusIds.Completed,
  OmnichainIndexingStatusIds.Following,
];

/**
 * Check if provided indexing status supports the Registrar Actions API.
 */
export function hasRegistrarActionsIndexingStatusSupport(
  omnichainIndexingStatusId: OmnichainIndexingStatusId,
): PrerequisiteResult {
  const supported = registrarActionsSupportedIndexingStatusIds.some(
    (supportedIndexingStatusId) => supportedIndexingStatusId === omnichainIndexingStatusId,
  );
  if (supported) return { supported };

  return {
    supported: false,
    reason: `The Registrar Actions API requires the connected ENSNode's Indexing Status to be one of the following: ${registrarActionsSupportedIndexingStatusIds.join(", ")}.`,
  };
}
