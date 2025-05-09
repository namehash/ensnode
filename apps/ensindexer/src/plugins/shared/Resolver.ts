import { ponder } from "ponder:registry";

import { makeResolverHandlers } from "@/handlers/Resolver";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";

/**
 * Shared Resolver indexing functions should be registered exactly once, or Ponder will complain about
 * multiple indexing functions being registered for these events. This boolean allows this
 * ENSIndexerPluginHandler to be idempotent — many plugins can call it, but only one will succeed,
 * which is enough to correctly register multi-network Resolver indexing handlers.
 */
let hasBeenRegistered = false;

export default function ({ pluginName }: ENSIndexerPluginHandlerArgs) {
  if (hasBeenRegistered) return;
  hasBeenRegistered = true;

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
    handleZoneCreated,
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
  ponder.on(
    "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    handleDNSRecordChanged,
  );
  ponder.on(
    "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    handleDNSRecordChanged,
  );
  ponder.on("Resolver:DNSRecordDeleted", handleDNSRecordDeleted);
  ponder.on("Resolver:DNSZonehashChanged", handleDNSZonehashChanged);
  ponder.on("Resolver:ZoneCreated", handleZoneCreated);
}
