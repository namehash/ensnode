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

import { handleRegistrarControllerEvent } from "../../shared/lib/registrar-controller-events";
import { getRegistrarManagedName } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  const subregistryId = getDatasourceContract(
    config.namespace,
    DatasourceNames.Basenames,
    "BaseRegistrar",
  );

  /**
   * No Registrar Controller for Basenames implements premiums or
   * emits distinct baseCost or premium (as opposed to just a simple price)
   * in events.
   */
  const pricing = {
    baseCost: null,
    premium: null,
    total: null,
  } satisfies RegistrarActionPricingNotApplicable;

  /**
   * No Registrar Controller for Basenames implements referrals or
   * emits a referrer in events.
   */
  const referral = {
    encodedReferrer: null,
    decodedReferrer: null,
  } satisfies RegistrarActionReferralNotApplicable;

  /**
   * Basenames_EARegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_EARegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      await handleRegistrarControllerEvent(context, {
        id,
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  /**
   * Basenames_RegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_RegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      await handleRegistrarControllerEvent(context, {
        id,
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Basenames_RegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      await handleRegistrarControllerEvent(context, {
        id,
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  /**
   * Basenames_UpgradeableRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      await handleRegistrarControllerEvent(context, {
        id,
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Basenames_UpgradeableRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      await handleRegistrarControllerEvent(context, {
        id,
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );
}
