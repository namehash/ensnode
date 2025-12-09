import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem";

import { DatasourceNames } from "@ensnode/datasources";
import {
  addPrices,
  decodeEncodedReferrer,
  getDatasourceContract,
  makeSubdomainNode,
  PluginName,
  priceEth,
  type RegistrarActionPricingAvailable,
  type RegistrarActionReferralAvailable,
  type RegistrarActionReferralNotApplicable,
} from "@ensnode/ensnode-sdk";

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
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );

  /**
   * Ethnames_LegacyEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

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
    namespaceContract(pluginName, "Ethnames_LegacyEthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);

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
   * Ethnames_WrappedEthRegistrarController Event Handlers
   */

  ponder.on(
    namespaceContract(pluginName, "Ethnames_WrappedEthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
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
        subregistryId,
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
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
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
        subregistryId,
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
      const id = event.id;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
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
        subregistryId,
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
      const id = event.id;
      const labelHash = event.args.labelhash;
      const node = makeSubdomainNode(labelHash, parentNode);
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
        subregistryId,
        node,
        pricing,
        referral,
        transactionHash,
      });
    },
  );
}
