import { PluginName } from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { handleResolverImplementationChange } from "@/lib/protocol-acceleration/resolver-db-helpers";

const pluginName = PluginName.ProtocolAcceleration;

/**
 * Handlers for any Resolvers that are UpgradableProxies, necessary for tracking implementation updates.
 */
export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "UpgradableProxyResolver:Upgraded"),
    async ({ context, event }) => {
      const resolver = getThisAccountId(context, event);
      await handleResolverImplementationChange(context, resolver);
    },
  );
}
