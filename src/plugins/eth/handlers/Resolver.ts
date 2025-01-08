import { ponder } from "ponder:registry";
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
} from "../../../handlers/Resolver";
import { pluginNamespace } from "../ponder.config";

export default function () {
  // Old registry handlers
  ponder.on(pluginNamespace("OldRegistryResolvers:AddrChanged"), handleAddrChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:AddressChanged"), handleAddressChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:NameChanged"), handleNameChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:ABIChanged"), handleABIChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    pluginNamespace(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    pluginNamespace(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(pluginNamespace("OldRegistryResolvers:ContenthashChanged"), handleContenthashChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(
    pluginNamespace("OldRegistryResolvers:AuthorisationChanged"),
    handleAuthorisationChanged,
  );
  ponder.on(pluginNamespace("OldRegistryResolvers:VersionChanged"), handleVersionChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(pluginNamespace("OldRegistryResolvers:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(pluginNamespace("OldRegistryResolvers:DNSZonehashChanged"), handleDNSZonehashChanged);

  // New registry handlers
  ponder.on(pluginNamespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(pluginNamespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(pluginNamespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(pluginNamespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(pluginNamespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    pluginNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    pluginNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(pluginNamespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(pluginNamespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(pluginNamespace("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(pluginNamespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(pluginNamespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
