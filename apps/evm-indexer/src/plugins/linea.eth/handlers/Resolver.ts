import { ponder } from "ponder:registry";
import {
  handleABIChanged,
  handleAddrChanged,
  handleAddressChanged,
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
  ponder.on(pluginNamespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(pluginNamespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(pluginNamespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(pluginNamespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(pluginNamespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(pluginNamespace("Resolver:TextChanged"), handleTextChanged);
  ponder.on(pluginNamespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(pluginNamespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(pluginNamespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(pluginNamespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(pluginNamespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
