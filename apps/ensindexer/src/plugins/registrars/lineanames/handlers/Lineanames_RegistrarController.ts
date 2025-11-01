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
import { buildEventRef } from "@/lib/registrars/event-ref";
import {
  buildRegistrarAction,
  getIncrementalDurationForRegistration,
  getIncrementalDurationForRenewal,
} from "@/lib/registrars/registrar-action";

import { getRegistrarManagedName } from "../../lineanames/lib/registrar-helpers";
import { handleRegistrarAction } from "../../shared/lib/handle-registrar-controller-events";
import { getCurrentRegistration } from "../../shared/lib/registration";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));
  /**
   * No Registrar Controller for Lineanames implements referrals or emits
   * a referrer in events.
   */
  const encodedReferrer = zeroEncodedReferrer;

  /**
   * Lineanames_EthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.baseCost;
      const premium = event.args.premium;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRegistered,
          ...event,
        }),
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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionTypes.Renewal;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
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
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRenewed,
          ...event,
        }),
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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:PohNameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // Lineanames_EthRegistrarController allows any wallet address holding
      // a Proof of Humanity (Poh) to register one subname for free.
      const baseCost = 0n;
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRegistered,
          ...event,
        }),
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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:OwnerNameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      // The owner of the Lineanames_EthRegistrarController is allowed to
      // register subnames for free.
      const baseCost = 0n;
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;

      // Get incremental duration for Registration Action
      const incrementalDuration = getIncrementalDurationForRegistration(
        Number(timestamp),
        Number(expiresAt),
      );

      const registrarAction = buildRegistrarAction(
        buildEventRef({
          chainId: context.chain.id,
          name: RegistrarEventNames.NameRegistered,
          ...event,
        }),
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
