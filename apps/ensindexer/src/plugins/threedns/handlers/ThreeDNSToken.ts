import { ponder } from "ponder:registry";
import { setupRootNode } from "@/handlers/Registry";
import { makeResolverHandlers } from "@/handlers/Resolver";
import { makeThreeDNSTokenHandlers } from "@/handlers/ThreeDNSToken";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.ThreeDNS>) {
  ///
  /// ThreeDNSToken Handlers
  ///

  const { handleNewOwner, handleRegistrationCreated } = makeThreeDNSTokenHandlers({ pluginName });

  // register each handler on each contract
  ponder.on(namespace("ThreeDNSToken:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSToken:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSToken:RegistrationCreated"), handleRegistrationCreated);

  ///
  /// ThreeDNSResolver Handlers
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
  } = makeResolverHandlers({ pluginName });

  ponder.on(namespace("ThreeDNSResolver:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("ThreeDNSResolver:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("ThreeDNSResolver:NameChanged"), handleNameChanged);
  ponder.on(namespace("ThreeDNSResolver:ABIChanged"), handleABIChanged);
  ponder.on(namespace("ThreeDNSResolver:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespace(
      "ThreeDNSResolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    namespace(
      "ThreeDNSResolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespace("ThreeDNSResolver:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("ThreeDNSResolver:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("ThreeDNSResolver:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(namespace("ThreeDNSResolver:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("ThreeDNSResolver:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("ThreeDNSResolver:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("ThreeDNSResolver:DNSZonehashChanged"), handleDNSZonehashChanged);
}
