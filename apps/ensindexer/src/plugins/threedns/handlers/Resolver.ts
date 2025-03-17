import { ponder } from "ponder:registry";
import { makeResolverHandlers } from "../../../handlers/Resolver";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"">) {
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

  ponder.on(namespace("ThreeDNSRegControl:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("ThreeDNSRegControl:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("ThreeDNSRegControl:NameChanged"), handleNameChanged);
  ponder.on(namespace("ThreeDNSRegControl:ABIChanged"), handleABIChanged);
  ponder.on(namespace("ThreeDNSRegControl:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(namespace("ThreeDNSRegControl:TextChanged"), handleTextChanged);
  ponder.on(namespace("ThreeDNSRegControl:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("ThreeDNSRegControl:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("ThreeDNSRegControl:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("ThreeDNSRegControl:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("ThreeDNSRegControl:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("ThreeDNSRegControl:DNSZonehashChanged"), handleDNSZonehashChanged);
}
