import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import config from "@/config";
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
} from "@/handlers/Resolver";
import { namespaceContract } from "@/lib/plugin-helpers";

const pluginName = PluginName.ThreeDNS;

if (config.plugins.includes(pluginName)) {
  ponder.on(namespaceContract(pluginName, "Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:NameChanged"), handleNameChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:ABIChanged"), handleABIChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespaceContract(pluginName, "Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(
    namespaceContract(pluginName, "Resolver:AuthorisationChanged"),
    handleAuthorisationChanged,
  );
  ponder.on(namespaceContract(pluginName, "Resolver:VersionChanged"), handleVersionChanged);
  // NOTE: 3DNS' Resolver contract only emits DNSRecordChanged with the included `ttl` argument
  // and we explicitly do not index ens-contracts' IDNSRecordResolver#DNSRecordChanged (without the `ttl`)
  // in this file, as these handlers are 3DNS-specific
  ponder.on(
    namespaceContract(
      pluginName,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleDNSRecordChanged,
  );
  ponder.on(namespaceContract(pluginName, "Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespaceContract(pluginName, "Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
  ponder.on(namespaceContract(pluginName, "Resolver:ZoneCreated"), handleZoneCreated);
}
