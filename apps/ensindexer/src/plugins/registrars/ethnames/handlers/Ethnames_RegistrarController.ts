import { ponder } from "ponder:registry";

import {
  addPrices,
  decodeEncodedReferrer,
  makeSubdomainNode,
  PluginName,
  priceEth,
  type RegistrarActionPricingAvailable,
  type RegistrarActionReferralAvailable,
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
   * Ethnames_LegacyEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRegistered"),
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

      /**
       * Ethnames_LegacyEthRegistrarController does not implement premiums,
       * however, it implements base cost.
       */
      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_LegacyEthRegistrarController does not implement referrals or
       * emits a referrer in events.
       */
      const referral = {
        encodedReferrer: null,
        decodedReferrer: null,
      } satisfies RegistrarActionReferralNotApplicable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRenewed"),
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

      /**
       * Ethnames_LegacyEthRegistrarController does not implement premiums,
       * however, it implements base cost.
       *
       * Premium for renewals is always 0 anyway.
       */
      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_LegacyEthRegistrarController does not implement referrals or
       * emits a referrer in events.
       */
      const referral = {
        encodedReferrer: null,
        decodedReferrer: null,
      } satisfies RegistrarActionReferralNotApplicable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  /**
   * Ethnames_WrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController:NameRegistered"),
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

      /**
       * Ethnames_WrappedEthRegistrarController implements premiums, and base cost.
       */
      const baseCost = priceEth(event.args.baseCost);
      const premium = priceEth(event.args.premium);
      const total = addPrices(baseCost, premium);
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_WrappedEthRegistrarController does not implement referrals or
       * emits a referrer in events.
       */
      const referral = {
        encodedReferrer: null,
        decodedReferrer: null,
      } satisfies RegistrarActionReferralNotApplicable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController:NameRenewed"),
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

      /**
       * Ethnames_WrappedEthRegistrarController implements premiums, and base cost.
       *
       * Premium for renewals is always 0 anyway.
       */
      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_WrappedEthRegistrarController does not implement referrals or
       * emits a referrer in events.
       */
      const referral = {
        encodedReferrer: null,
        decodedReferrer: null,
      } satisfies RegistrarActionReferralNotApplicable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  /**
   * Ethnames_UnwrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // rename to labelHash
          labelhash: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      /**
       * Ethnames_UnwrappedEthRegistrarController implements premiums, and base cost.
       */
      const baseCost = priceEth(event.args.baseCost);
      const premium = priceEth(event.args.premium);
      const total = addPrices(baseCost, premium);
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_UnwrappedEthRegistrarController implements referrals and
       * emits a referrer in events.
       */
      const encodedReferrer = event.args.referrer;
      const decodedReferrer = decodeEncodedReferrer(encodedReferrer);

      const referral = {
        encodedReferrer,
        decodedReferrer,
      } satisfies RegistrarActionReferralAvailable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_UnwrappedEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // rename to labelHash
          labelhash: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      /**
       * Ethnames_UnwrappedEthRegistrarController implements premiums, and base cost.
       *
       * Premium for renewals is always 0 anyway.
       */
      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

      /**
       * Ethnames_UnwrappedEthRegistrarController implements referrals and
       * emits a referrer in events.
       */
      const encodedReferrer = event.args.referrer;
      const decodedReferrer = decodeEncodedReferrer(encodedReferrer);

      const referral = {
        encodedReferrer,
        decodedReferrer,
      } satisfies RegistrarActionReferralAvailable;

      await handleRegistrarControllerEvent(context, {
        id,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );
}
