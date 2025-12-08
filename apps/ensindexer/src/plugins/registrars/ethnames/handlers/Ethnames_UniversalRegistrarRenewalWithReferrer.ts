import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem";

import { DatasourceNames } from "@ensnode/datasources";
import {
  decodeEncodedReferrer,
  makeSubdomainNode,
  PluginName,
  type RegistrarActionReferralAvailable,
} from "@ensnode/ensnode-sdk";

import { getDatasourceContract } from "@/lib/datasource-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import { handleUniversalRegistrarRenewalEvent } from "@/plugins/registrars/shared/lib/universal-registrar-renewal-with-referrer-events";

import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  const subregistryId = getDatasourceContract(
    config.namespace,
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_UniversalRegistrarRenewalWithReferrer:RenewalReferred"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.labelHash;
      const node = makeSubdomainNode(labelHash, parentNode);
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
