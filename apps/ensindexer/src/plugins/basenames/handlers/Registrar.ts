import { ponder } from "ponder:registry";

import { type LabelHash, PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";

/**
 * When direct subnames of base.eth are registered through the base.eth RegistrarController contract
 * on Base, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT will be
 * assigned a unique tokenId represented as uint256(labelhash(label)) where label is the direct
 * subname of base.eth that was registered.
 * https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.Basenames>) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    // the shared Registrar handlers in this plugin index direct subnames of '.base.eth'
    registrarManagedName: "base.eth",
  });

  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(namespace("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
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
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(namespace("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(namespace("RegistrarController:NameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(namespace("RegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });
}
