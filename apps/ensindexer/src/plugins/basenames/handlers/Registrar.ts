import { ponder } from "ponder:registry";

import { type LabelHash, PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { makePluginNamespace } from "@/lib/plugin-helpers";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * When direct subnames of base.eth are registered through the base.eth RegistrarController contract
 * on Base, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT will be
 * assigned a unique tokenId represented as uint256(labelhash(label)) where label is the direct
 * subname of base.eth that was registered.
 * https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

/**
 * Attach a set of event handlers for indexing process.
 */
export function attachBasenamesRegistrarEventHandlers() {
  const pluginName = PluginName.Basenames;

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

  // create a namespace for the plugin events to avoid conflicts with other plugins
  const ns = makePluginNamespace(pluginName);

  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(ns("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(ns("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(ns("BaseRegistrar:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewed({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(ns("BaseRegistrar:Transfer"), async ({ context, event }) => {
    await handleNameTransferred({
      context,
      event: { ...event, args: { ...event.args, labelHash: tokenIdToLabelHash(event.args.id) } },
    });
  });

  ponder.on(ns("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(ns("RegistrarController:NameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(ns("RegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });
}
