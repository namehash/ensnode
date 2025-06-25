import { ponder } from "ponder:registry";
import { type LabelHash, PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";

/**
 * When direct subnames of .eth are registered through the ETHRegistrarController contract on
 * Ethereum mainnet, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId which is uint256(labelhash(label)) where label is the
 * direct subname of .eth that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  pluginNamespace: ns,
}: ENSIndexerPluginHandlerArgs<PluginName.Subgraph>) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    // the shared Registrar handlers in this plugin index direct subnames of '.eth'
    registrarManagedName: "eth",
  });

  ponder.on(ns("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          labelHash: tokenIdToLabelHash(event.args.id),
        },
      },
    });
  });

  ponder.on(ns("BaseRegistrar:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewed({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          labelHash: tokenIdToLabelHash(event.args.id),
        },
      },
    });
  });

  ponder.on(ns("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { tokenId, from, to } = event.args;
    await handleNameTransferred({
      context,
      event: {
        ...event,
        args: {
          from,
          to,
          labelHash: tokenIdToLabelHash(tokenId),
        },
      },
    });
  });

  ponder.on(ns("EthRegistrarControllerOld:NameRegistered"), async ({ context, event }) => {
    // the old registrar controller just had `cost` param
    await handleNameRegisteredByController({ context, event });
  });

  ponder.on(ns("EthRegistrarControllerOld:NameRenewed"), async ({ context, event }) => {
    // the old registrar controller just had `cost` param
    await handleNameRenewedByController({ context, event });
  });

  ponder.on(ns("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          // the new registrar controller uses baseCost + premium to compute cost
          cost: event.args.baseCost + event.args.premium,
        },
      },
    });
  });

  ponder.on(ns("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({ context, event });
  });
}
