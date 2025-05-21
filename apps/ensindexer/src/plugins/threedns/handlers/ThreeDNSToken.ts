import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/utils";

import { makeResolverHandlers } from "@/handlers/Resolver";
import { makeThreeDNSTokenHandlers } from "@/handlers/ThreeDNSToken";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.ThreeDNS>) {
  ///
  /// ThreeDNSToken Handlers
  ///

  const {
    handleNewOwner, //
    handleTransfer,
    handleRegistrationCreated,
    handleRegistrationExtended,
  } = makeThreeDNSTokenHandlers({ pluginName });

  // register each handler on each contract
  ponder.on(namespace("ThreeDNSToken:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSToken:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSToken:Transfer"), handleTransfer);
  ponder.on(namespace("ThreeDNSToken:RegistrationCreated"), handleRegistrationCreated);
  ponder.on(namespace("ThreeDNSToken:RegistrationExtended"), handleRegistrationExtended);

  ///
  /// ThreeDNS Resolver Handlers
  ///

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

  ponder.on(namespace("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("Resolver:NameChanged"), handleNameChanged);
  ponder.on(namespace("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(namespace("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespace("Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)"),
    handleTextChanged,
  );
  ponder.on(
    namespace(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespace("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(namespace("Resolver:VersionChanged"), handleVersionChanged);
  // NOTE: 3DNS' Resolver contract only emits DNSRecordChanged with the included `ttl` argument
  // and we explicitly do not index ens-contracts' IDNSRecordResolver#DNSRecordChanged (without the `ttl`)
  // in this file, as these handlers are 3DNS-specific
  ponder.on(
    namespace(
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleDNSRecordChanged,
  );
  ponder.on(namespace("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
  ponder.on(namespace("Resolver:ZoneCreated"), handleZoneCreated);
}
