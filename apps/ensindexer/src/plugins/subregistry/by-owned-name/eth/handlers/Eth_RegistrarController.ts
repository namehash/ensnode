import { ponder } from "ponder:registry";
import {
  CurrencyIds,
  PluginName,
  RegistrarActionType,
  ZERO_RAW_REFERRER,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";
import { namehash } from "viem/ens";

import config from "@/config";
import { namespaceContract } from "@/lib/plugin-helpers";
import { handleRegistrarAction } from "@/lib/registrar-actions-helpers";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Subregistry;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));
  const currency = CurrencyIds.ETH;

  /**
   * Eth_LegacyEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Eth_LegacyEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      /**
       * Eth_LegacyEthRegistrarController does not emit a premium
       * in the NameRegistered event.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      /**
       * Eth_LegacyEthRegistrarController does not emit a referrer in
       * the NameRegistered event.
       */
      const rawReferrer = ZERO_RAW_REFERRER;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Eth_LegacyEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Renewal;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      /**
       * Premium is always zero for renewals.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name renewal,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      /**
       * Eth_LegacyEthRegistrarController does not emit a referrer in
       * the NameRenewed event.
       */
      const rawReferrer = ZERO_RAW_REFERRER;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );

  /**
   * Eth_WrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Eth_WrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.baseCost;
      const premium = event.args.premium;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      /**
       * Eth_WrappedEthRegistrarController does not emit a referrer in
       * the NameRegistered event.
       */
      const rawReferrer = ZERO_RAW_REFERRER;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Eth_WrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Renewal;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      /**
       * Premium is always zero for renewals.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name renewal,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      /**
       * Eth_WrappedEthRegistrarController does not emit a referrer in
       * the NameRenewed event.
       */
      const rawReferrer = ZERO_RAW_REFERRER;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );

  /**
   * Eth_UnwrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Eth_UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.baseCost;
      const premium = event.args.premium;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      const rawReferrer = event.args.referrer;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Eth_UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Renewal;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      const baseCost = event.args.cost;
      /**
       * Premium is always zero for renewals.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name renewal,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      const rawReferrer = event.args.referrer;

      await handleRegistrarAction(context, event, {
        type,
        node,
        expiresAt,
        baseCost: {
          currency,
          amount: baseCost,
        },
        premium: {
          currency,
          amount: premium,
        },
        registrant,
        rawReferrer,
      });
    },
  );
}
