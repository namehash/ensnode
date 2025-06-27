import { attachSharedResolverHandlers } from "@/plugins/shared/Resolver";
import { attachSubgraphNameWrapperEventHandlers } from "./handlers/NameWrapper";
import { attachSubgraphRegistrarEventHandlers } from "./handlers/Registrar";
import { attachSubgraphRegistryEventHandlers } from "./handlers/Registry";

/**
 * Attach plugin's event handlers for indexing.
 *
 * Note: this function is called when the plugin is active.
 */
export function attachSubgraphPluginEventHandlers() {
  // Leverage the shared Subgraph-compatible indexing logic.
  attachSharedResolverHandlers();

  // Apply Subgraph-specific indexing logic.
  attachSubgraphNameWrapperEventHandlers();
  attachSubgraphRegistrarEventHandlers();
  attachSubgraphRegistryEventHandlers();
}
