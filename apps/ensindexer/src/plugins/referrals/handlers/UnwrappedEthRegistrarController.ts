import { ponder } from "ponder:registry";
import { namehash } from "viem";

import { handleRegistrationReferral, handleRenewalReferral } from "@/handlers/Referrals";
import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";

const ETH_NODE = namehash("eth");

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Referrals;

  //////////////////////////////////
  // UnwrappedEthRegistrarController
  //////////////////////////////////

  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      await handleRegistrationReferral({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // NOTE: transaction sender pays for the name registration,
            // so we treat the transaction sender address as a referee
            referee: event.transaction.from,
            // NOTE: UnwrappedEthRegistrarController emits the labelHash of the name under '.eth'
            node: makeSubdomainNode(event.args.labelhash, ETH_NODE),
          },
        },
      });
    },
  );

  // UnwrappedEthRegistrarController includes referral tracking, so we index it here
  ponder.on(
    namespaceContract(pluginName, "UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      await handleRenewalReferral({
        context,
        event: {
          ...event,
          args: {
            ...event.args,
            // NOTE: transaction sender pays for the name renewal,
            // so we treat the transaction sender address as a referee
            referee: event.transaction.from,
            // NOTE: UnwrappedEthRegistrarController emits the labelHash of the name under '.eth'
            node: makeSubdomainNode(event.args.labelhash, ETH_NODE),
          },
        },
      });
    },
  );
}
