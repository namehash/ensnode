import { ponder } from "ponder:registry";

import { type LabelHash, PluginName } from "@ensnode/utils";
import { uint256ToHex32 } from "@ensnode/utils/subname-helpers";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";

/**
 * When direct subnames of linea.eth are registered through the linea.eth ETHRegistrarController
 * contract on Linea, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of linea.eth that was registered.
 * https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.Lineanames>) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    // the shared Registrar handlers in this plugin index direct subnames of '.linea.eth'
    registrarManagedName: "linea.eth",
  });

  ponder.on(namespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(namespace("BaseRegistrar:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewed({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(namespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    await handleNameTransferred({
      context,
      event: {
        ...event,
        args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.tokenId) },
      },
    });
  });

  ponder.on(namespace("EthRegistrarController:OwnerNameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          // Linea allows the owner of the EthRegistrarController to register subnames for free
          cost: 0n,
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarController:PohNameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          // Linea allows any wallet address holding a Proof of Humanity (Poh) to register one subname for free
          cost: 0n,
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
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

  ponder.on(namespace("EthRegistrarController:NameRenewed"), handleNameRenewedByController);
}
