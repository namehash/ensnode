import { interpretTokenIdAsLabelHash } from "enssdk";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { makeRegistrarHandlers } from "@/plugins/subgraph/shared-handlers/Registrar";

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
  } = makeRegistrarHandlers({ pluginName });

  ///////////////////////////////
  // BaseRegistrar
  // https://docs.ens.domains/registry/eth/#baseregistrar-vs-controller
  ///////////////////////////////

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegistered({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            labelHash: interpretTokenIdAsLabelHash(event.args.id),
          },
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
          args: {
            ...event.args,
            labelHash: interpretTokenIdAsLabelHash(event.args.id),
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const { tokenId, from, to } = event.args;
      await handleNameTransferred({
        context,
        event: {
          ...event,
          args: {
            from,
            to,
            labelHash: interpretTokenIdAsLabelHash(tokenId),
          },
        },
      });
    },
  );

  ///////////////////////////////
  // LegacyEthRegistrarController
  ///////////////////////////////

  addOnchainEventListener(
    namespaceContract(pluginName, "LegacyEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // LegacyEthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "LegacyEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // LegacyEthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
          },
        },
      });
    },
  );

  ////////////////////////////////
  // WrappedEthRegistrarController
  ////////////////////////////////

  addOnchainEventListener(
    namespaceContract(pluginName, "WrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            // WrappedEthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
            // the WrappedEthRegistrarController#NameRegistered uses baseCost + premium for full cost
            cost: event.args.baseCost + event.args.premium,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "WrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // WrappedEthRegistrarController incorrectly names its event arguments, so we re-map them here
            label: event.args.name,
            labelHash: event.args.label,
          },
        },
      });
    },
  );

  //////////////////////////////////
  // UnwrappedEthRegistrarController
  //////////////////////////////////

  addOnchainEventListener(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: {
            label: event.args.label,
            // NOTE: remapping `labelhash` to `labelHash` to match ENSNode terminology
            labelHash: event.args.labelhash,
            // the UnwrappedEthRegistrarController#NameRegistered uses baseCost + premium for full cost
            cost: event.args.baseCost + event.args.premium,
          },
        },
      });
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            label: event.args.label,
            // NOTE: remapping `labelhash` to `labelHash` to match ENSNode terminology
            labelHash: event.args.labelhash,
            // UnwrappedEthRegistrarController#NameRenewed provides direct `cost` argument
          },
        },
      });
    },
  );
}
