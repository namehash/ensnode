import { ponder } from "ponder:registry";

import {
  makeSubdomainNode,
  PluginName,
  type RegistrarActionPricingUnknown,
  type RegistrarActionReferralNotApplicable,
} from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";

import { handleRegistrarControllerEvent } from "../../shared/lib/registrar-controller-events";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;

  /**
   * No Registrar Controller for Basenames implements premiums or
   * emits distinct baseCost or premium (as opposed to just a simple price)
   * in events.
   *
   * TODO: [Index the pricing data for "logical registrar actions" for Basenames.](https://github.com/namehash/ensnode/issues/1256)
   */
  const pricing = {
    baseCost: null,
    premium: null,
    total: null,
  } satisfies RegistrarActionPricingUnknown;

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
      const {
        id,
        args: {
          // this field is the labelhash, not the label
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
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
      const {
        id,
        args: {
          // this field is the labelhash, not the label
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
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
      const {
        id,
        args: {
          // this field is the labelhash, not the label
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
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
      const {
        id,
        args: {
          // this field is the labelhash, not the label
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
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
      const {
        id,
        args: {
          // this field is the labelhash, not the label
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
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
