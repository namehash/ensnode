import { ponder } from "ponder:registry";

import { makeResolverHandlers } from "@/handlers/Resolver";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({ namespace }: PonderENSPluginHandlerArgs<PluginName.Root>) {
  const {
    handleABIChanged,
    handleAddrChanged,
    handleAddressChanged,
    handleAuthorisationChanged,
    handleContenthashChanged,
    handleDNSRecordChanged,
    handleDNSRecordDeleted,
    handleDNSZonehashChanged,
    handleInterfaceChanged,
    handleNameChanged,
    handlePubkeyChanged,
    handleTextChanged,
    handleVersionChanged,
  } = makeResolverHandlers({
    eventIdPrefix: null, // NOTE: no event id prefix for root plugin (subgraph-compat)
  });

  ponder.on(namespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(namespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(namespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespace("Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)"),
    handleTextChanged,
  );
  ponder.on(
    namespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(namespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
