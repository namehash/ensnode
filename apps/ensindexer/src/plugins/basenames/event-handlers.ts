import { attachSharedResolverHandlers } from "@/plugins/shared/Resolver";
import { attachBasenamesRegistrarEventHandlers } from "./handlers/Registrar";
import { attachBasenamesRegistryEventHandlers } from "./handlers/Registry";

/**
 * Attach plugin's event handlers for indexing.
 *
 * Note: this function is called when the plugin is active.
 */
export function attachBasenamesPluginEventHandlers() {
  // Leverage the shared Subgraph-compatible indexing logic.
  attachSharedResolverHandlers();

  // Apply Basenames-specific indexing logic.
  attachBasenamesRegistrarEventHandlers();
  attachBasenamesRegistryEventHandlers();
}
