import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem/ens";

import { DatasourceNames } from "@ensnode/datasources";
import {
  makeSubdomainNode,
  PluginName,
  type RegistrarActionPricingNotApplicable,
  type RegistrarActionReferralNotApplicable,
} from "@ensnode/ensnode-sdk";

import { getDatasourceContract } from "@/lib/datasource-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";

import { getRegistrarManagedName } from "../../lineanames/lib/registrar-helpers";
import { handleRegistrarControllerEvent } from "../../shared/lib/registrar-controller-events";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  const subregistryId = getDatasourceContract(
    config.namespace,
    DatasourceNames.Lineanames,
    "BaseRegistrar",
  );

  /**
   * No Registrar Controller for Lineanames implements premiums or
   * emits distinct baseCost or premium (as opposed to just a simple price)
   * in events.
   */
  const pricing = {
    baseCost: null,
    premium: null,
    total: null,
  } satisfies RegistrarActionPricingNotApplicable;

  /**
   * No Registrar Controller for Lineanames implements referrals or
   * emits a referrer in events.
   */
  const referral = {
    encodedReferrer: null,
    decodedReferrer: null,
  } satisfies RegistrarActionReferralNotApplicable;

  /**
   * Lineanames_EthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:OwnerNameRegistered"),
    async ({ context, event }) => {
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

      await handleRegistrarControllerEvent(context, event, {
        subregistryId,
        node,
        pricing,
        referral,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:PohNameRegistered"),
    async ({ context, event }) => {
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

      await handleRegistrarControllerEvent(context, event, {
        subregistryId,
        node,
        pricing,
        referral,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

      await handleRegistrarControllerEvent(context, event, {
        subregistryId,
        node,
        pricing,
        referral,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

      await handleRegistrarControllerEvent(context, event, {
        subregistryId,
        node,
        pricing,
        referral,
      });
    },
  );
}
