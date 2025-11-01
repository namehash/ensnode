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
   * Ethnames_LegacyEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      // Ethnames_LegacyEthRegistrarController does not implement premiums or emit a premium
      // in the NameRegistered event.
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;
      // Ethnames_LegacyEthRegistrarController does not implement referrals or emit a referrer in
      // the NameRegistered event.
      const encodedReferrer = zeroEncodedReferrer;

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
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRenewed"),
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
      // Ethnames_LegacyEthRegistrarController does not implement referrals or emit a referrer in
      // the NameRenewed event.
      const encodedReferrer = zeroEncodedReferrer;

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

  /**
   * Ethnames_WrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController:NameRegistered"),
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
      // Ethnames_WrappedEthRegistrarController does not implement referrals or emit a referrer in
      // the NameRegistered event.
      const encodedReferrer = zeroEncodedReferrer;

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
    namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController:NameRenewed"),
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
      // Ethnames_WrappedEthRegistrarController does not implement referrals or emit a referrer in
      // the NameRenewed event.
      const encodedReferrer = zeroEncodedReferrer;

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

  /**
   * Ethnames_UnwrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const timestamp = event.block.timestamp;
      const type = RegistrarActionTypes.Registration;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.baseCost;
      const premium = event.args.premium;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;
      const encodedReferrer = event.args.referrer;

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
    namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionTypes.Renewal;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      // Premium is always zero for renewals.
      const premium = 0n;
      // Transaction sender is registrant.
      const registrant = event.transaction.from;
      const encodedReferrer = event.args.referrer;

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
}
