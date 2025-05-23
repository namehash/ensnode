import { ponder } from "ponder:registry";

import * as handlers from "@/handlers/Resolver";

/**
 * Shared Resolver indexing functions should be registered exactly once, or Ponder will complain about
 * multiple indexing functions being registered for these events. This boolean allows this
 * ENSIndexerPluginHandler to be idempotent — many plugins can call it, but only one will succeed,
 * which is enough to correctly register multi-network Resolver indexing handlers.
 */
let hasBeenRegistered = false;

export default function registerResolverHandlers() {
  if (hasBeenRegistered) return;
  hasBeenRegistered = true;

  ponder.on("Resolver:AddrChanged", handlers.handleAddrChanged);
  ponder.on("Resolver:AddressChanged", handlers.handleAddressChanged);
  ponder.on("Resolver:NameChanged", handlers.handleNameChanged);
  ponder.on("Resolver:ABIChanged", handlers.handleABIChanged);
  ponder.on("Resolver:PubkeyChanged", handlers.handlePubkeyChanged);
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    handlers.handleTextChanged,
  );
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    handlers.handleTextChanged,
  );
  ponder.on("Resolver:ContenthashChanged", handlers.handleContenthashChanged);
  ponder.on("Resolver:InterfaceChanged", handlers.handleInterfaceChanged);
  ponder.on("Resolver:AuthorisationChanged", handlers.handleAuthorisationChanged);
  ponder.on("Resolver:VersionChanged", handlers.handleVersionChanged);
  // ens-contracts' IDNSRecordResolver#DNSRecordChanged
  // https://github.com/ensdomains/ens-contracts/blob/b6bc1eac9d241b7334ce78a51bacdf272f37fdf5/contracts/resolvers/profiles/IDNSRecordResolver.sol#L6
  ponder.on(
    "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    handlers.handleDNSRecordChanged,
  );
  // NOTE: this DNSRecordChanged ABI spec with the included `ttl` parameter is specific to
  // 3DNS' Resolver implementation, but we include it here for theoretical completeness, were a
  // Resolver indexed by these shared rh.handlers to emit this event.
  ponder.on(
    "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    handlers.handleDNSRecordChanged,
  );
  ponder.on("Resolver:DNSRecordDeleted", handlers.handleDNSRecordDeleted);
  ponder.on("Resolver:DNSZonehashChanged", handlers.handleDNSZonehashChanged);
  ponder.on("Resolver:ZoneCreated", handlers.handleZoneCreated);
}
