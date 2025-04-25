import { Context, ponder } from "ponder:registry";
import { setupRootNode } from "@/handlers/Registry";
import { makeResolverHandlers } from "@/handlers/Resolver";
import { makeThreeDNSTokenHandlers } from "@/handlers/ThreeDNSToken";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

const getUriForTokenId = async (context: Context, tokenId: bigint): Promise<string> => {
  const ThreeDNSToken = context.contracts["threedns/ThreeDNSTokenOptimism"];
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
  ponder.on(namespace("ThreeDNSTokenOptimism:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSTokenOptimism:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSTokenOptimism:RegistrationCreated"), handleRegistrationCreated);

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

  ponder.on(namespace("ThreeDNSResolverOptimism:AddrChanged"), handleAddrChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:AddressChanged"), handleAddressChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:NameChanged"), handleNameChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:ABIChanged"), handleABIChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:PubkeyChanged"), handlePubkeyChanged);
  ponder.on(
    namespace(
      "ThreeDNSResolverOptimism:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    handleTextChanged,
  );
  ponder.on(
    namespace(
      "ThreeDNSResolverOptimism:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    handleTextChanged,
  );
  ponder.on(namespace("ThreeDNSResolverOptimism:ContenthashChanged"), handleContenthashChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:InterfaceChanged"), handleInterfaceChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:AuthorisationChanged"), handleAuthorisationChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:VersionChanged"), handleVersionChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:DNSRecordChanged"), handleDNSRecordChanged);
  ponder.on(namespace("ThreeDNSResolverOptimism:DNSRecordDeleted"), handleDNSRecordDeleted);
  ponder.on(namespace("ThreeDNSResolverOptimism:DNSZonehashChanged"), handleDNSZonehashChanged);
}
