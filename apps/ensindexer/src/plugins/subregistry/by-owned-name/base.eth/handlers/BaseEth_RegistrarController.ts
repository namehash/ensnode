import { ponder } from "ponder:registry";
import {
  BASENAMES_NODE,
  CurrencyIds,
  ETH_NODE,
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
   * No Registrar Controller event includes a referrer.
   */
  const rawReferrer = ZERO_RAW_REFERRER;
  /**
   * No Registrar Controller event includes a base cost.
   */
  const baseCost = 0n;
  /**
   * No Registrar Controller event includes a premium.
   */
  const premium = 0n;

  /**
   * BaseEth_EARegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "BaseEth_EARegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;

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
   * BaseEth_RegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "BaseEth_RegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;
      /**
       * BaseEth_RegistrarController does not emit a referrer in
       * the NameRegistered event.
       */

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
    namespaceContract(pluginName, "BaseEth_RegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Renewal;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      /**
       * Premium is always zero for renewals.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name renewal,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;

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
   * BaseEth_UpgradeableRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "BaseEth_UpgradeableRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Registration;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      /**
       * Transaction sender pays for the name registration,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;

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
    namespaceContract(pluginName, "BaseEth_UpgradeableRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const type = RegistrarActionType.Renewal;
      const labelHash = event.args.label;
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;
      /**
       * Premium is always zero for renewals.
       */
      const premium = 0n;
      /**
       * Transaction sender pays for the name renewal,
       * so we treat the transaction sender address as a registrant
       */
      const registrant = event.transaction.from;

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
