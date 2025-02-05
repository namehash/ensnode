import { ponder } from "ponder:registry";
import { makeResolverHandlers } from "../../../handlers/Resolver";
import { PonderENSPluginHandlerOptions } from "../../../lib/plugin-helpers";

export default function ({ ownedName, namespace }: PonderENSPluginHandlerOptions<"linea.eth">) {
  const {
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
  } = makeResolverHandlers(ownedName);

  ponder.on(namespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(namespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(namespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(namespace("Resolver:TextChanged"), handleTextChanged);
  ponder.on(namespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("Resolver:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("Resolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
