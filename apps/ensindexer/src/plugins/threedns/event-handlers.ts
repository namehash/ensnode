import { attachThreeDNSTokenEventHandlers } from "./handlers/ThreeDNSToken";

/**
 * Attach plugin's event handlers for indexing.
 *
 * Note: this function is called when the plugin is active.
 */
export function attachThreeDNSPluginEventHandlers() {
  // Apply ThreeDNS-specific indexing logic.
  attachThreeDNSTokenEventHandlers();
}
