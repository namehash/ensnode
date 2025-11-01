import config from "@/config";

import { ponder } from "ponder:registry";
import { zeroEncodedReferrer } from "@namehash/ens-referrals";
import { namehash } from "viem/ens";

import {
  CurrencyIds,
  makeSubdomainNode,
  PluginName,
  RegistrarActionTypes,
  RegistrarEventNames,
} from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import {
  buildRegistrarAction,
  getIncrementalDurationForRegistration,
  getIncrementalDurationForRenewal,
} from "@/lib/registrars/registrar-action";

import { handleRegistrarAction } from "../../shared/lib/handle-registrar-controller-events";
import { getCurrentRegistration } from "../../shared/lib/registration";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));
  /**
   * No Registrar Controller for Basenames implements referrals or
   * emits a referrer in events.
   */
  const encodedReferrer = zeroEncodedReferrer;
  /**
   * No Registrar Controller for Basenames implements premiums or
   * emits distinct baseCost or premium (as opposed to just a simple price)
   * in events.
   */
  const baseCost = 0n;
  const premium = 0n;

  /**
   * Basenames_EARegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_EARegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        {
          id: event.id,
          name: RegistrarEventNames.NameRegistered,
          chainId: context.chain.id,
          block: {
            number: Number(event.block.number),
            timestamp: Number(event.block.timestamp),
          },
          contractAddress: event.log.address,
          transactionHash: event.transaction.hash,
          logIndex: event.log.logIndex,
        },
        {
          type,
          node,
          expiresAt,
          baseCost,
          premium,
          incrementalDuration,
          registrant,
          encodedReferrer,
        },
        CurrencyIds.ETH,
      );

      await handleRegistrarAction(context, registrarAction);
    },
  );

  /**
   * Basenames_RegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_RegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        {
          id: event.id,
          name: RegistrarEventNames.NameRegistered,
          chainId: context.chain.id,
          block: {
            number: Number(event.block.number),
            timestamp: Number(event.block.timestamp),
          },
          contractAddress: event.log.address,
          transactionHash: event.transaction.hash,
          logIndex: event.log.logIndex,
        },
        {
          type,
          node,
          expiresAt,
          baseCost,
          premium,
          incrementalDuration,
          registrant,
          encodedReferrer,
        },
        CurrencyIds.ETH,
      );

      await handleRegistrarAction(context, registrarAction);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Basenames_RegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionTypes.Renewal;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Premium is always zero for renewals.
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get the state of the registration for this node before this renewal occurred.
      const currentRegistration = await getCurrentRegistration(context, { node });

      // Invariant: the current registration must exist.
      if (!currentRegistration) {
        throw new Error(`The current registration for "${node}" node does not exist.`);
      }

      // Get incremental duration for Renewal Action
      const incrementalDuration = getIncrementalDurationForRenewal(
        currentRegistration,
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        {
          id: event.id,
          name: RegistrarEventNames.NameRenewed,
          chainId: context.chain.id,
          block: {
            number: Number(event.block.number),
            timestamp: Number(event.block.timestamp),
          },
          contractAddress: event.log.address,
          transactionHash: event.transaction.hash,
          logIndex: event.log.logIndex,
        },
        {
          type,
          node,
          expiresAt,
          baseCost,
          premium,
          incrementalDuration,
          registrant,
          encodedReferrer,
        },
        CurrencyIds.ETH,
      );

      await handleRegistrarAction(context, registrarAction);
    },
  );

  /**
   * Basenames_UpgradeableRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        {
          id: event.id,
          name: RegistrarEventNames.NameRegistered,
          chainId: context.chain.id,
          block: {
            number: Number(event.block.number),
            timestamp: Number(event.block.timestamp),
          },
          contractAddress: event.log.address,
          transactionHash: event.transaction.hash,
          logIndex: event.log.logIndex,
        },
        {
          type,
          node,
          expiresAt,
          baseCost,
          premium,
          incrementalDuration,
          registrant,
          encodedReferrer,
        },
        CurrencyIds.ETH,
      );

      await handleRegistrarAction(context, registrarAction);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionTypes.Renewal;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Premium is always zero for renewals.
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get the state of the registration for this node before this renewal occurred.
      const currentRegistration = await getCurrentRegistration(context, { node });

      // Invariant: the current registration must exist.
      if (!currentRegistration) {
        throw new Error(`The current registration for "${node}" node does not exist.`);
      }

      // Get incremental duration for Renewal Action
      const incrementalDuration = getIncrementalDurationForRenewal(
        currentRegistration,
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        {
          id: event.id,
          name: RegistrarEventNames.NameRenewed,
          chainId: context.chain.id,
          block: {
            number: Number(event.block.number),
            timestamp: Number(event.block.timestamp),
          },
          contractAddress: event.log.address,
          transactionHash: event.transaction.hash,
          logIndex: event.log.logIndex,
        },
        {
          type,
          node,
          expiresAt,
          baseCost,
          premium,
          incrementalDuration,
          registrant,
          encodedReferrer,
        },
        CurrencyIds.ETH,
      );

      await handleRegistrarAction(context, registrarAction);
    },
  );
}
