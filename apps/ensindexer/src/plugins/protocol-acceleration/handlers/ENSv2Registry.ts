import type { Address } from "viem";

import { getCanonicalId, makeENSv2DomainId, PluginName } from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { ensureDomainResolverRelation } from "@/lib/protocol-acceleration/domain-resolver-relationship-db-helpers";

const pluginName = PluginName.ProtocolAcceleration;

export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:ResolverUpdated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: bigint;
        resolver: Address;
      }>;
    }) => {
      const { tokenId, resolver } = event.args;

      const registry = getThisAccountId(context, event);
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registry, canonicalId);

      await ensureDomainResolverRelation(context, registry, domainId, resolver);
    },
  );
}
