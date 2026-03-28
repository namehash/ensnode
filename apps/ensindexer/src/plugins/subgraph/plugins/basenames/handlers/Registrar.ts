import { interpretTokenIdAsLabelHash, PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { makeRegistrarHandlers } from "@/plugins/subgraph/shared-handlers/Registrar";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Basenames;

  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({ pluginName });

  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:NameRegisteredWithRecord"),
    async ({ context, event }) => {
      await handleNameRegistered({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: interpretTokenIdAsLabelHash(event.args.id) },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegistered({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: interpretTokenIdAsLabelHash(event.args.id) },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewed({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: interpretTokenIdAsLabelHash(event.args.id) },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:Transfer"),
    async ({ context, event }) => {
      await handleNameTransferred({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: interpretTokenIdAsLabelHash(event.args.tokenId) },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "EARegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            // EARegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            cost: 0n,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "RegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            // RegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            cost: 0n,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "RegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            // RegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            cost: 0n,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "UpgradeableRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            // UpgradeableRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            cost: 0n,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "UpgradeableRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            // UpgradeableRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            cost: 0n,
          },
        },
      });
    },
  );
}
