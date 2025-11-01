import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem/ens";

import { makeSubdomainNode, PluginName, RegistrarEventNames } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import { buildEventRef } from "@/lib/registrars/event-ref";
import { buildRegistration } from "@/lib/registrars/registration";

import {
  handleControllerAddedToRegistrar,
  handleControllerRemovedFromRegistrar,
  handleRegistration,
  handleRenewal,
} from "../../shared/lib/handle-registrar-events";
import { getRegistrarManagedName, tokenIdToLabelHash } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  ponder.on(
    namespaceContract(pluginName, "Lineanames_BaseRegistrar:ControllerAdded"),
    async ({ context, event }) => {
      await handleControllerAddedToRegistrar(
        context,
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.ControllerAdded,
          ...event,
        }),
        {
          chainId: context.chain.id,
          controllerAddress: event.args.controller,
          registrarAddress: event.log.address,
        },
      );
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_BaseRegistrar:ControllerRemoved"),
    async ({ context, event }) => {
      await handleControllerRemovedFromRegistrar(
        context,
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.ControllerRemoved,
          ...event,
        }),
        {
          chainId: context.chain.id,
          controllerAddress: event.args.controller,
        },
      );
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;

      await handleRegistration(
        context,
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRegistered,
          ...event,
        }),
        buildRegistration({
          node,
          parentNode,
          expiresAt,
        }),
      );
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;

      await handleRenewal(
        context,
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRenewed,
          ...event,
        }),
        buildRegistration({
          node,
          parentNode,
          expiresAt,
        }),
      );
    },
  );
}
