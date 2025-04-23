import { Context, ponder } from "ponder:registry";
import { setupRootNode } from "@/handlers/Registry";
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
  const { handleNewOwner, handleRegistrationCreated } = makeThreeDNSTokenHandlers({
    pluginName,
    getUriForTokenId,
  });

  // register each handler on each contract
  ponder.on(namespace("ThreeDNSTokenBase:setup"), setupRootNode);
  ponder.on(namespace("ThreeDNSTokenBase:NewOwner"), handleNewOwner);
  ponder.on(namespace("ThreeDNSTokenBase:RegistrationCreated"), handleRegistrationCreated);
}
