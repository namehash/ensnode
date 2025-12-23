import { ponder } from "ponder:registry";
import { namehash } from "viem";

import {
  decodeEncodedReferrer,
  makeSubdomainNode,
  PluginName,
  type RegistrarActionReferralAvailable,
} from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import { handleUniversalRegistrarRenewalEvent } from "@/plugins/registrars/shared/lib/universal-registrar-renewal-with-referrer-events";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;

  ponder.on(
    namespaceContract(pluginName, "Ethnames_UniversalRegistrarRenewalWithReferrer:RenewalReferred"),
    async ({ context, event }) => {
      const {
        id,
        args: { labelHash },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const managedNode = namehash(getManagedName(subregistryId));
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      /**
       * Ethnames_UniversalRegistrarRenewalWithReferrer implements referrals and
       * emits a referrer in events.
       */
      const encodedReferrer = event.args.referrer;
      const decodedReferrer = decodeEncodedReferrer(encodedReferrer);

      const referral = {
        encodedReferrer,
        decodedReferrer,
      } satisfies RegistrarActionReferralAvailable;

      await handleUniversalRegistrarRenewalEvent(context, {
        id,
        subregistryId,
        node,
        referral,
        transactionHash,
      });
    },
  );
}
