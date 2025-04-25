import { Context, ponder } from "ponder:registry";
import { setupRootNode } from "@/handlers/Registry";
import { makeResolverHandlers } from "@/handlers/Resolver";
import { makeThreeDNSTokenHandlers } from "@/handlers/ThreeDNSToken";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

const getUriForTokenId = async (context: Context, tokenId: bigint): Promise<string> => {
  const ThreeDNSToken = context.contracts["threedns/ThreeDNSTokenBase"];
  return context.client.readContract({
    abi: ThreeDNSToken.abi,
    address: ThreeDNSToken.address,
    functionName: "uri",
    args: [tokenId],
  });
};

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.ThreeDNS>) {
  ///
  /// ThreeDNSToken Handlers
  ///

  const { handleNewOwner, handleRegistrationCreated } = makeThreeDNSTokenHandlers({
    pluginName,
    getUriForTokenId,
  });

  // register each handler on each contract
  ponder.on(namespace("ThreeDNSTokenBase:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSTokenBase:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSTokenBase:RegistrationCreated"), handleRegistrationCreated);

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

  ponder.on(namespace("ThreeDNSResolverBase:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("ThreeDNSResolverBase:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("ThreeDNSResolverBase:NameChanged"), handleNameChanged);
  ponder.on(namespace("ThreeDNSResolverBase:ABIChanged"), handleABIChanged);
  ponder.on(namespace("ThreeDNSResolverBase:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespace(
      "ThreeDNSResolverBase:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    namespace(
      "ThreeDNSResolverBase:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespace("ThreeDNSResolverBase:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("ThreeDNSResolverBase:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("ThreeDNSResolverBase:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(namespace("ThreeDNSResolverBase:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("ThreeDNSResolverBase:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("ThreeDNSResolverBase:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("ThreeDNSResolverBase:DNSZonehashChanged"), handleDNSZonehashChanged);
}
