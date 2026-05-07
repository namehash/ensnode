import { makeSubdomainNode } from "enssdk";

import {
  addPrices,
  decodeEncodedReferrer,
  PluginName,
  priceEth,
  type RegistrarActionPricingAvailable,
  type RegistrarActionReferralAvailable,
  type RegistrarActionReferralNotApplicable,
} from "@ensnode/ensnode-sdk";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";

import { handleRegistrarControllerEvent } from "../../shared/lib/registrar-controller-events";
import { handleUniversalRegistrarRenewalEvent } from "../../shared/lib/universal-registrar-renewal-with-referrer-events";

/**
 * Registers event handlers for the various .eth RegistrarControllers.
 */
export default function () {
  const pluginName = PluginName.Registrars;

  /**
   * NameRegistered (yes base cost, no premium, no referral)
   * - LegacyEthRegistrarController
   */
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Ethnames_RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 cost, uint256 expires)",
    ),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // `label` param is misnamed onchain — re-map to proper ENS terminology
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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
   * WrappedEthRegistrarController: NameRegistered (premium, no referral)
   */
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Ethnames_RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires)",
    ),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // `label` param is misnamed onchain — re-map to proper ENS terminology
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.baseCost);
      const premium = priceEth(event.args.premium);
      const total = addPrices(baseCost, premium);
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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
   * NameRegistered (yes base cost, yes premium, yes referral)
   * - UnwrappedEthRegistrarController
   */
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Ethnames_RegistrarController:NameRegistered(string label, bytes32 indexed labelhash, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires, bytes32 referrer)",
    ),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // `labelhash` should be `labelHash` — re-map to proper ENS terminology
          labelhash: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.baseCost);
      const premium = priceEth(event.args.premium);
      const total = addPrices(baseCost, premium);
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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

  /**
   * NameRenewed (yes base cost, no premium, no referral).
   * - LegacyEthRegistrarController
   * - WrappedEthRegistrarController
   */
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Ethnames_RegistrarController:NameRenewed(string name, bytes32 indexed label, uint256 cost, uint256 expires)",
    ),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // `label` param is misnamed onchain — re-map to proper ENS terminology
          label: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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
   * NameRenewed (yes base cost, no premium, yes referral)
   * - UnwrappedEthRegistrarController:
   */
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Ethnames_RegistrarController:NameRenewed(string label, bytes32 indexed labelhash, uint256 cost, uint256 expires, bytes32 referrer)",
    ),
    async ({ context, event }) => {
      const {
        id,
        args: {
          // `labelhash` should be `labelHash` — re-map to proper ENS terminology
          labelhash: labelHash,
        },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const baseCost = priceEth(event.args.cost);
      const premium = priceEth(0n);
      const total = baseCost;
      const pricing = {
        baseCost,
        premium,
        total,
      } satisfies RegistrarActionPricingAvailable;

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

  /**
   * RenewalReferred (no base cost, no premium, yes referrer).
   * - UniversalRegistrarRenewalWithReferrer
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "Ethnames_RegistrarController:RenewalReferred"),
    async ({ context, event }) => {
      const {
        id,
        args: { labelHash },
      } = event;

      const subregistryId = getThisAccountId(context, event);
      const { node: managedNode } = getManagedName(subregistryId);
      const node = makeSubdomainNode(labelHash, managedNode);
      const transactionHash = event.transaction.hash;

      const encodedReferrer = event.args.referrer;
      const decodedReferrer = decodeEncodedReferrer(encodedReferrer);
      const referral = {
        encodedReferrer,
        decodedReferrer,
      } satisfies RegistrarActionReferralAvailable;

      await handleUniversalRegistrarRenewalEvent(context, {
        id,
        node,
        referral,
        transactionHash,
      });
    },
  );
}
