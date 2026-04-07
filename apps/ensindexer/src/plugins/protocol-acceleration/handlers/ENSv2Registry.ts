import { type Address, makeENSv2DomainId, makeStorageId } from "enssdk";

import { PluginName } from "@ensnode/ensnode-sdk";

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
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      await ensureDomainResolverRelation(context, registry, domainId, resolver);
    },
  );
}
