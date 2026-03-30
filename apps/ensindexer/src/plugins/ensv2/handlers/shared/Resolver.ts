import { PluginName } from "@ensnode/ensnode-sdk";

import { ensureResolverEvent } from "@/lib/ensv2/event-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { LogEventBase } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

/**
 * Handlers for Resolver contracts in the ENSv2 plugin. Note that the Protocol Acceleration plugin
 * handles most indexing behavior, these additional indexing functions:
 *
 * - ensure that the event for the Resolver is indexed
 */
export default function () {
  async function handleResolverEvent({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: LogEventBase;
  }) {
    const resolver = getThisAccountId(context, event);
    await ensureResolverEvent(context, event, resolver);
  }

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AddrChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AddressChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:NameChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:ContenthashChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:ABIChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:PubkeyChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:InterfaceChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AuthorisationChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:VersionChanged"),
    handleResolverEvent,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:DNSRecordDeleted"),
    handleResolverEvent,
  );

  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleResolverEvent,
  );

  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleResolverEvent,
  );

  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    ),
    handleResolverEvent,
  );

  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleResolverEvent,
  );
}
