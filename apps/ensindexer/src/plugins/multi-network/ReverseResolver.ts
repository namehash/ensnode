import { ponder } from "ponder:registry";

import {
  handleAddrChanged,
  handleAddressChanged,
  handleDNSRecordChanged,
  handleDNSRecordDeleted,
  handleNameChanged,
  handleTextChanged,
} from "@/handlers/Resolver";

/**
 * Multi-Network ReverseResolver indexing functions should be registered exactly once, or Ponder will
 * complain about multiple indexing functions being registered for these events. This boolean allows this
 * ENSIndexerPluginHandler to be idempotent — many plugins can call it, but only one will succeed,
 * which is enough to correctly register multi-network Resolver indexing handlers.
 */
let hasBeenRegistered = false;

export default function registerReverseResolverHandlers() {
  if (hasBeenRegistered) return;
  hasBeenRegistered = true;

  ponder.on("ReverseResolver:AddrChanged", handleAddrChanged);
  ponder.on("ReverseResolver:AddressChanged", handleAddressChanged);
  ponder.on("ReverseResolver:NameChanged", handleNameChanged);
  ponder.on(
    "ReverseResolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    handleTextChanged,
  );
  ponder.on(
    "ReverseResolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    handleTextChanged,
  );
  // ens-contracts' IDNSRecordResolver#DNSRecordChanged
  // https://github.com/ensdomains/ens-contracts/blob/b6bc1eac9d241b7334ce78a51bacdf272f37fdf5/contracts/resolvers/profiles/IDNSRecordResolver.sol#L6
  ponder.on(
    "ReverseResolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    handleDNSRecordChanged,
  );
  // NOTE: this DNSRecordChanged ABI spec with the included `ttl` parameter is specific to
  // 3DNS' Resolver implementation, but we include it here for theoretical completeness, were a
  // Resolver indexed by these shared handlers to emit this event.
  ponder.on(
    "ReverseResolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    handleDNSRecordChanged,
  );
  ponder.on("ReverseResolver:DNSRecordDeleted", handleDNSRecordDeleted);
}
