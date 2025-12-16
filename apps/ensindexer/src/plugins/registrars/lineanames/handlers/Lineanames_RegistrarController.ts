import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem/ens";

import { DatasourceNames } from "@ensnode/datasources";
import {
  addPrices,
  getDatasourceContract,
  makeSubdomainNode,
  PluginName,
  priceEth,
  type RegistrarActionPricingAvailable,
  type RegistrarActionReferralNotApplicable,
} from "@ensnode/ensnode-sdk";

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
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      /**
       * The `OwnerNameRegistered` event emitted by
       * `Lineanames_EthRegistrarController` contract is akin to
       * the `NameRegistered` event with `baseCost` of `0` and `premium` of `0`.
       */
      const pricing = {
        baseCost: priceEth(0n),
        premium: priceEth(0n),
        total: priceEth(0n),
      } satisfies RegistrarActionPricingAvailable;

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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:PohNameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      /**
       * The `PohNameRegistered` event emitted by
       * `Lineanames_EthRegistrarController` contract is akin to
       * the `NameRegistered` event with `baseCost` of `0` and `premium` of `0`.
       */
      const pricing = {
        baseCost: priceEth(0n),
        premium: priceEth(0n),
        total: priceEth(0n),
      } satisfies RegistrarActionPricingAvailable;

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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.baseCost);
      const premium = priceEth(event.args.premium);
      const total = addPrices(baseCost, premium);
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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
    namespaceContract(pluginName, "Lineanames_EthRegistrarController:NameRenewed"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = event.args.label; // this field is the labelhash, not the label
      const node = makeSubdomainNode(labelHash, parentNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n); // premium for renewals is always 0
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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
