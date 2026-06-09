import { PluginName } from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { reclassifyResolverExtendedSupport } from "@/lib/protocol-acceleration/resolver-db-helpers";

const pluginName = PluginName.ProtocolAcceleration;

/**
 * Handlers for the 3DNS Resolver, an EIP-1967 upgradeable proxy (resolves `.box` and other 3DNS
 * TLDs on Mainnet).
 *
 * Its `IExtendedResolver` (ENSIP-10) support was activated by an `Upgraded` after it was assigned
 * as a Resolver, so the first-visibility `isExtended` classification is a stale `false`. We re-run
 * the eip-165 probe on each `Upgraded` to keep `Resolver.extended` correct. See issue #2275.
 */
export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "ThreeDNSResolver:Upgraded"),
    async ({ context, event }) => {
      await reclassifyResolverExtendedSupport(context, getThisAccountId(context, event));
    },
  );
}
