import { ponder } from "ponder:registry";
import { type LabelHash, PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { namespaceContract } from "@/lib/plugin-helpers";

/**
 * When direct subnames of .eth are registered through the ETHRegistrarController contract on
 * Ethereum mainnet, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId which is uint256(labelhash(label)) where label is the
 * direct subname of .eth that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Subgraph;

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

  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(namespaceContract(pluginName, "BaseRegistrar:Transfer"), async ({ context, event }) => {
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

  ///////////////////////////////
  // LegacyEthRegistrarController
  ///////////////////////////////

  ponder.on(
    namespaceContract(pluginName, "LegacyEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      // the old registrar controller just had `cost` param
      await handleNameRegisteredByController({ context, event });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "LegacyEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      // the legacy registrar controller just had `cost` param
      await handleNameRenewedByController({ context, event });
    },
  );

  ////////////////////////////////
  // WrappedEthRegistrarController
  ////////////////////////////////

  ponder.on(
    namespaceContract(pluginName, "WrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // the WrappedEthRegistrarController uses baseCost + premium to compute cost
            cost: event.args.baseCost + event.args.premium,
          },
        },
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "WrappedEthRegistrarController:NameRenewed"),
    handleNameRenewedByController,
  );

  //////////////////////////////////
  // UnwrappedEthRegistrarController
  //////////////////////////////////

  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            // the UnwrappedEthRegistrarController uses the correct argument names (`label`, `labelhash`)
            // so we re-map them back to the subgraph-expected nomenclature here
            name: event.args.label,
            label: event.args.labelhash,
            // the UnwrappedEthRegistrarController uses baseCost + premium to compute cost
            cost: event.args.baseCost + event.args.premium,
          },
        },
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            // the UnwrappedEthRegistrarController uses the correct argument names (`label`, `labelhash`)
            // so we re-map them back to the subgraph-expected nomenclature here
            name: event.args.label,
            label: event.args.labelhash,
            // cost is
            cost: event.args.cost,
          },
        },
      });
    },
  );
}
