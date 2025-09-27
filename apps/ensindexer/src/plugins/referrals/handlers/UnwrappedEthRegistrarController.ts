import { ponder } from "ponder:registry";

import { namespaceContract } from "@/lib/plugin-helpers";
import { handleRegistrationReferral, handleRenewalReferral } from "@/lib/referrals-helpers";
import { ETH_NODE, PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { zeroHash } from "viem";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Referrals;

  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      // no referrer? nothing to do
      if (event.args.referrer === zeroHash) return;

      await handleRegistrationReferral(context, event, {
        referrer: event.args.referrer,
        baseCost: event.args.baseCost,
        premium: event.args.premium,

        // NOTE: transaction sender pays for the name registration,
        // so we treat the transaction sender address as a referee
        referee: event.transaction.from,

        // NOTE: UnwrappedEthRegistrarController emits the labelHash of the name under '.eth'
        node: makeSubdomainNode(event.args.labelhash, ETH_NODE),
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      // no referrer? nothing to do
      if (event.args.referrer === zeroHash) return;

      await handleRenewalReferral(context, event, {
        referrer: event.args.referrer,
        cost: event.args.cost,

        // NOTE: transaction sender pays for the name renewal,
        // so we treat the transaction sender address as a referee
        referee: event.transaction.from,

        // NOTE: UnwrappedEthRegistrarController emits the labelHash of the name under '.eth'
        node: makeSubdomainNode(event.args.labelhash, ETH_NODE),
      });
    },
  );
}
