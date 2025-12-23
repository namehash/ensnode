import { ponder } from "ponder:registry";

import { PluginName } from "@ensnode/ensnode-sdk";

import { tokenIdToLabelHash } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import { makeRegistrarHandlers } from "@/plugins/subgraph/shared-handlers/Registrar";

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
  } = makeRegistrarHandlers({ pluginName });

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
            // EthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
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
            // EthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
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
            // EthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            // the new registrar controller uses baseCost + premium to compute cost
            cost: event.args.baseCost + event.args.premium,
          },
        },
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "EthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // EthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
          },
        },
      });
    },
  );
}
