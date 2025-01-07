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
import { ponderNamespace } from "../ponder.config";

export default function () {
  // Old registry handlers
  ponder.on(ponderNamespace("OldRegistryResolvers:AddrChanged"), handleAddrChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:AddressChanged"), handleAddressChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:NameChanged"), handleNameChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:ABIChanged"), handleABIChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    ponderNamespace(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    ponderNamespace(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(ponderNamespace("OldRegistryResolvers:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(
    ponderNamespace("OldRegistryResolvers:AuthorisationChanged"),
    handleAuthorisationChanged,
  );
  ponder.on(ponderNamespace("OldRegistryResolvers:VersionChanged"), handleVersionChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(ponderNamespace("OldRegistryResolvers:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ponderNamespace("OldRegistryResolvers:DNSZonehashChanged"), handleDNSZonehashChanged);

  // New registry handlers
  ponder.on(ponderNamespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(ponderNamespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(ponderNamespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(ponderNamespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(ponderNamespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    ponderNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    ponderNamespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(ponderNamespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ponderNamespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(ponderNamespace("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(ponderNamespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(ponderNamespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(ponderNamespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ponderNamespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
