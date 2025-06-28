import { attachSharedResolverHandlers } from "@/plugins/shared/Resolver";
import { attachLineanamesNameWrapperEventHandlers } from "./handlers/NameWrapper";
import { attachLineanamesRegistrarEventHandlers } from "./handlers/Registrar";
import { attachLineanamesRegistryEventHandlers } from "./handlers/Registry";

/**
 * Attach plugin's event handlers for indexing.
 *
 * Note: this function is called when the plugin is active.
 */
export function attachLineanamesPluginEventHandlers() {
  // Leverage the shared Subgraph-compatible indexing logic.
  attachSharedResolverHandlers();

  // Apply Lineanames-specific indexing logic.
  attachLineanamesNameWrapperEventHandlers();
  attachLineanamesRegistrarEventHandlers();
  attachLineanamesRegistryEventHandlers();
}
