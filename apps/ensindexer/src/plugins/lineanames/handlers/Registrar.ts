import { ponder } from "ponder:registry";

import { type LabelHash, PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { namespaceContract } from "@/lib/plugin-helpers";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * When direct subnames of linea.eth are registered through the linea.eth ETHRegistrarController
 * contract on Linea, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of linea.eth that was registered.
 * https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Lineanames;

  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    // the shared Registrar handlers in this plugin index direct subnames of
    // the name returned from `getRegistrarManagedName` function call
    registrarManagedName: getRegistrarManagedName(config.namespace),
  });

  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegistered({
        context,
        event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewed({
        context,
        event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
      });
    },
  );

  ponder.on(namespaceContract(pluginName, "BaseRegistrar:Transfer"), async ({ context, event }) => {
    await handleNameTransferred({
      context,
      event: {
        ...event,
        args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.tokenId) },
      },
    });
  });

  ponder.on(
    namespaceContract(pluginName, "EthRegistrarController:OwnerNameRegistered"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(
    namespaceContract(pluginName, "EthRegistrarController:PohNameRegistered"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(
    namespaceContract(pluginName, "EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(
    namespaceContract(pluginName, "EthRegistrarController:NameRenewed"),
    handleNameRenewedByController,
  );
}
