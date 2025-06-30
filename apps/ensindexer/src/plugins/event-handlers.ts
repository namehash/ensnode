import { PluginName } from "@ensnode/ensnode-sdk";

// Shared Resolver Handlers
import { attachSharedResolverHandlers } from "@/plugins/shared/Resolver";

// Subgraph Handlers
import { attachSubgraphNameWrapperEventHandlers } from "./subgraph/handlers/NameWrapper";
import { attachSubgraphRegistrarEventHandlers } from "./subgraph/handlers/Registrar";
import { attachSubgraphRegistryEventHandlers } from "./subgraph/handlers/Registry";

// Basenames Handlers
import { attachBasenamesRegistrarEventHandlers } from "./basenames/handlers/Registrar";
import { attachBasenamesRegistryEventHandlers } from "./basenames/handlers/Registry";

// Lineanames Handlers
import { attachLineanamesNameWrapperEventHandlers } from "./lineanames/handlers/NameWrapper";
import { attachLineanamesRegistrarEventHandlers } from "./lineanames/handlers/Registrar";
import { attachLineanamesRegistryEventHandlers } from "./lineanames/handlers/Registry";

// ThreeDNS Handlers
import { attachThreeDNSResolverEventHandlers } from "./threedns/handlers/ThreeDNSResolver";
import { attachThreeDNSTokenEventHandlers } from "./threedns/handlers/ThreeDNSToken";

/**
 * Maps from a PluginName to the 'attach' functions that register the appropriate Ponder event
 * handlers. ponder.config.ts will call {@link attachPluginEventHandlers} to conditionally
 * register a specific plugin's handlers with Ponder.
 *
 * NOTE: defined separate from plugin.ts to avoid possible circular dependencies
 */
const EVENT_HANDLERS: Record<PluginName, VoidFunction[]> = {
  [PluginName.Basenames]: [
    attachBasenamesRegistrarEventHandlers,
    attachBasenamesRegistryEventHandlers,

    // NOTE: shared Resolver handlers
    attachSharedResolverHandlers,
  ],
  [PluginName.Lineanames]: [
    attachLineanamesNameWrapperEventHandlers,
    attachLineanamesRegistrarEventHandlers,
    attachLineanamesRegistryEventHandlers,

    // NOTE: shared Resolver handlers
    attachSharedResolverHandlers,
  ],
  [PluginName.Subgraph]: [
    attachSubgraphNameWrapperEventHandlers,
    attachSubgraphRegistrarEventHandlers,
    attachSubgraphRegistryEventHandlers,

    // NOTE: shared Resolver handlers
    attachSharedResolverHandlers,
  ],
  [PluginName.ThreeDNS]: [
    attachThreeDNSTokenEventHandlers,

    // NOTE: ThreeDNS-specific Resolver handlers
    attachThreeDNSResolverEventHandlers,
  ],
};

/**
 * Attach plugin's event handlers for indexing.
 *
 * @param {PluginName} pluginName name of the plugin of which events handlers must be attached for indexing.
 */
export function attachPluginEventHandlers(pluginName: PluginName) {
  EVENT_HANDLERS[pluginName].forEach((attach) => attach());
}
