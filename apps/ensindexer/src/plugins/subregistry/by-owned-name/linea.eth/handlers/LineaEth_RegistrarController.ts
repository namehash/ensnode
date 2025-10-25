import { ponder } from "ponder:registry";

import { namespaceContract } from "@/lib/plugin-helpers";
import { handleRegistrarAction } from "@/lib/registrar-actions-helpers";
import {
  CurrencyIds,
  ETH_NODE,
  LINEANAMES_NODE,
  PluginName,
  RegistrarActionType,
  ZERO_RAW_REFERRER,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Subregistry;
  const currency = CurrencyIds.ETH;
  const parentNode = LINEANAMES_NODE;
  /**
   * No Registrar Controller event includes a referrer.
   */
  const rawReferrer = ZERO_RAW_REFERRER;

  /**
   * LineaEth_EthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "LineaEth_EthRegistrarController:NameRegistered"),
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
       * LineaEth_EthRegistrarController does not emit a referrer in
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
    namespaceContract(pluginName, "LineaEth_EthRegistrarController:NameRenewed"),
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
