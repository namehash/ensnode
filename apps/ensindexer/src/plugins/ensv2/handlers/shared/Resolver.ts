import { type Context, ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { ensureResolverEvent } from "@/lib/ensv2/event-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
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
    context: Context;
    event: LogEventBase;
  }) {
    const resolver = getThisAccountId(context, event);
    await ensureResolverEvent(context, event, resolver);
  }

  ponder.on(namespaceContract(pluginName, "Resolver:AddrChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:AddressChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:NameChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:ContenthashChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:ABIChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:PubkeyChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:InterfaceChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:AuthorisationChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:VersionChanged"), handleResolverEvent);
  ponder.on(namespaceContract(pluginName, "Resolver:DNSRecordDeleted"), handleResolverEvent);

  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleResolverEvent,
  );

  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleResolverEvent,
  );

  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    ),
    handleResolverEvent,
  );

  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleResolverEvent,
  );
}
