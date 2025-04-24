import { ponder } from "ponder:registry";

import { makeResolverHandlers } from "@/handlers/Resolver";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";

export default function ({ pluginName }: ENSIndexerPluginHandlerArgs) {
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
  } = makeResolverHandlers({ pluginName });

  ponder.on("Resolver:AddrChanged", handleAddrChanged);
  ponder.on("Resolver:AddressChanged", handleAddressChanged);
  ponder.on("Resolver:NameChanged", handleNameChanged);
  ponder.on("Resolver:ABIChanged", handleABIChanged);
  ponder.on("Resolver:PubkeyChanged", handlePubkeyChanged);
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    handleTextChanged,
  );
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    handleTextChanged,
  );
  ponder.on("Resolver:ContenthashChanged", handleContenthashChanged);
  ponder.on("Resolver:InterfaceChanged", handleInterfaceChanged);
  ponder.on("Resolver:AuthorisationChanged", handleAuthorisationChanged);
  ponder.on("Resolver:VersionChanged", handleVersionChanged);
  ponder.on("Resolver:DNSRecordChanged", handleDNSRecordChanged);
  ponder.on("Resolver:DNSRecordDeleted", handleDNSRecordDeleted);
  ponder.on("Resolver:DNSZonehashChanged", handleDNSZonehashChanged);
}
