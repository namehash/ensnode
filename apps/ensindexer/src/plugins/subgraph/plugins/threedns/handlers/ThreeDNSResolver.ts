import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
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
} from "@/plugins/subgraph/shared-handlers/Resolver";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.ThreeDNS;

  addOnchainEventListener(namespaceContract(pluginName, "Resolver:AddrChanged"), handleAddrChanged);
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AddressChanged"),
    handleAddressChanged,
  );
  addOnchainEventListener(namespaceContract(pluginName, "Resolver:NameChanged"), handleNameChanged);
  addOnchainEventListener(namespaceContract(pluginName, "Resolver:ABIChanged"), handleABIChanged);
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:PubkeyChanged"),
    handlePubkeyChanged,
  );
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:ContenthashChanged"),
    handleContenthashChanged,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:InterfaceChanged"),
    handleInterfaceChanged,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AuthorisationChanged"),
    handleAuthorisationChanged,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:VersionChanged"),
    handleVersionChanged,
  );
  // NOTE: 3DNS' Resolver contract only emits DNSRecordChanged with the included `ttl` argument
  // and we explicitly do not index ens-contracts' IDNSRecordResolver#DNSRecordChanged (without the `ttl`)
  // in this file, as these handlers are 3DNS-specific
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleDNSRecordChanged,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:DNSRecordDeleted"),
    handleDNSRecordDeleted,
  );
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:DNSZonehashChanged"),
    handleDNSZonehashChanged,
  );
  addOnchainEventListener(namespaceContract(pluginName, "Resolver:ZoneCreated"), handleZoneCreated);
}
