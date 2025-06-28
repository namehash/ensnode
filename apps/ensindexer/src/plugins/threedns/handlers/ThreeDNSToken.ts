import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

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
import {
  handleNewOwner,
  handleRegistrationCreated,
  handleRegistrationExtended,
  handleTransfer,
} from "@/handlers/ThreeDNSToken";
import { makePluginNamespace } from "@/lib/plugin-helpers";
import { setupRootNode } from "@/lib/subgraph-helpers";

export function attachThreeDNSTokenEventHandlers() {
  const pluginName = PluginName.ThreeDNS;

  // create a namespace for the plugin events to avoid conflicts with other plugins
  const ns = makePluginNamespace(pluginName);

  ///
  /// ThreeDNSToken Handlers
  ///

  ponder.on(ns("ThreeDNSToken:setup"), setupRootNode);
  ponder.on(ns("ThreeDNSToken:NewOwner"), handleNewOwner);
  ponder.on(ns("ThreeDNSToken:Transfer"), handleTransfer);
  ponder.on(ns("ThreeDNSToken:RegistrationCreated"), handleRegistrationCreated);
  ponder.on(ns("ThreeDNSToken:RegistrationExtended"), handleRegistrationExtended);

  ///
  /// ThreeDNS Resolver Handlers
  ///

  ponder.on(ns("Resolver:AddrChanged"), handleAddrChanged);
  ponder.on(ns("Resolver:AddressChanged"), handleAddressChanged);
  ponder.on(ns("Resolver:NameChanged"), handleNameChanged);
  ponder.on(ns("Resolver:ABIChanged"), handleABIChanged);
  ponder.on(ns("Resolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    ns("Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)"),
    handleTextChanged,
  );
  ponder.on(
    ns(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(ns("Resolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(ns("Resolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(ns("Resolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(ns("Resolver:VersionChanged"), handleVersionChanged);
  // NOTE: 3DNS' Resolver contract only emits DNSRecordChanged with the included `ttl` argument
  // and we explicitly do not index ens-contracts' IDNSRecordResolver#DNSRecordChanged (without the `ttl`)
  // in this file, as these handlers are 3DNS-specific
  ponder.on(
    ns(
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    handleDNSRecordChanged,
  );
  ponder.on(ns("Resolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(ns("Resolver:DNSZonehashChanged"), handleDNSZonehashChanged);
  ponder.on(ns("Resolver:ZoneCreated"), handleZoneCreated);
}
