import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { ItemType } from "@opensea/seaport-js/lib/constants";

import config from "@/config";
import { sharedEventValues, upsertAccount } from "@/lib/db-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { getDomainIdByTokenId, isKnownTokenIssuingContract } from "@ensnode/datasources";
import { Address, Hex } from "viem";

type OfferItem = {
  itemType: ItemType;
  token: Address; // contract address
  identifier: bigint; // token id
  amount: bigint;
};

type ConsiderationItem = {
  itemType: ItemType;
  token: Address; // contract address
  identifier: bigint; // token id
  amount: bigint;
  recipient: Address;
};

type Item = OfferItem | ConsiderationItem;

interface SeaportOrderFulfilledEvent
  extends EventWithArgs<{
    /**
     * The unique hash identifier of the fulfilled order.
     * Used to track and reference specific orders on-chain.
     */
    orderHash: Hex;

    /**
     * The address of the account that created and signed the original order.
     * This is the party offering items for trade.
     */
    offerer: Address;

    /**
     * The address of the zone contract that implements custom validation rules.
     * Zones can enforce additional restrictions like allowlists, time windows,
     * or other custom logic before order fulfillment. Can be zero address if
     * no additional validation is required.
     */
    zone: Address;

    /**
     * The address that receives the offered items from the order.
     * This is typically the order fulfiller or their designated recipient.
     */
    recipient: Address;

    /**
     * Array of items that the offerer is giving up in this order.
     * For listings: NFTs/tokens being sold
     * For offers: ETH/ERC20 tokens being offered as payment
     */
    offer: readonly OfferItem[];

    /**
     * Array of items that the offerer expects to receive in return.
     * For listings: ETH/ERC20 tokens expected as payment
     * For offers: NFTs/tokens being requested in exchange
     */
    consideration: readonly ConsiderationItem[];
  }> {}

type PaymentDetails = {
  currencyAddress: Address;
  totalAmount: bigint;
};

/**
 * Get the payment token address and total amount from the payment items
 */
function validateAndGetPaymentDetails(paymentItems: Item[]): PaymentDetails {
  if (paymentItems.length === 0) {
    throw new Error(
      "No payment item. Provide at least one payment item to get the payment token address.",
    );
  }

  // Get all unique tokens used in payment items
  const paymentTokens = paymentItems.map((item) => item.token);
  const uniqueTokens = [...new Set(paymentTokens)];

  // Mixed currencies
  if (uniqueTokens.length > 1) {
    throw new Error(
      "Too many currencies used. All payment items must be paid for with exactly the same currency.",
    );
  }

  // No currency
  if (uniqueTokens.length === 0) {
    throw new Error(
      "No payment item. Provide at least one payment item to get the payment token address.",
    );
  }

  // Calculate total payment amount
  const totalAmount = paymentItems.reduce((total, item) => total + item.amount, 0n);

  return {
    currencyAddress: uniqueTokens[0]!,
    totalAmount,
  };
}

/**
 * Handles NFT offers being fulfilled (seller accepting a buyer's offer)
 */
async function handleOfferFulfilled(
  context: Context,
  event: SeaportOrderFulfilledEvent,
  nftItem: ConsiderationItem,
  paymentItems: OfferItem[],
) {
  const { orderHash, offerer, recipient } = event.args;

  // In a fulfilled offer, the offerer is buying the NFT, recipient is selling
  const buyer = offerer;
  const seller = recipient;

  // Ensure accounts exist
  await upsertAccount(context, buyer);
  await upsertAccount(context, seller);

  // Get payment details
  const { currencyAddress, totalAmount } = validateAndGetPaymentDetails(paymentItems);

  const contractAddress = nftItem.token;
  const tokenId = nftItem.identifier.toString();

  // Get Domain ID
  const domainId = getDomainIdByTokenId(config.namespace, contractAddress, tokenId);

  // Record the sale
  await context.db.insert(schema.nameSold).values({
    ...sharedEventValues(context.chain.id, event),
    fromOwnerId: seller,
    newOwnerId: buyer,
    currencyAddress: currencyAddress,
    chainId: context.chain.id,
    logIndex: event.log.logIndex,
    orderHash: orderHash,
    price: totalAmount,
    contractAddress: contractAddress,
    tokenId: tokenId,
    tokenType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    domainId: domainId,
    createdAt: event.block.timestamp,
  });
}

/**
 * Handles NFT listings being fulfilled (buyer accepting a seller's listing)
 */
async function handleListingFulfilled(
  context: Context,
  event: SeaportOrderFulfilledEvent,
  nftItem: OfferItem,
  paymentItems: ConsiderationItem[],
) {
  const { orderHash, offerer, recipient } = event.args;

  // In a fulfilled listing, the offerer is selling the NFT, recipient is buying
  const seller = offerer;
  const buyer = recipient;

  // Ensure accounts exist
  await upsertAccount(context, seller);
  await upsertAccount(context, buyer);

  // Get payment details
  const { currencyAddress, totalAmount } = validateAndGetPaymentDetails(paymentItems);

  const contractAddress = nftItem.token;
  const tokenId = nftItem.identifier.toString();

  // Get domain ID
  const domainId = getDomainIdByTokenId(config.namespace, contractAddress, tokenId);

  // Record the sale
  await context.db.insert(schema.nameSold).values({
    ...sharedEventValues(context.chain.id, event),
    fromOwnerId: seller,
    newOwnerId: buyer,
    currencyAddress: currencyAddress,
    chainId: context.chain.id,
    logIndex: event.log.logIndex,
    orderHash: orderHash,
    price: totalAmount,
    contractAddress: contractAddress,
    tokenId: tokenId,
    tokenType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    domainId: domainId,
    createdAt: event.block.timestamp,
  });
}

/**
 * Checks if the item is an ERC721 or ERC1155 item
 * and if the token contract is a known token contract
 */
function isSupportedTokenTypeAndContract(
  item: OfferItem | ConsiderationItem,
  context: Context,
): boolean {
  if (!item || !item.token) return false;

  const chainId = context.chain.id;
  const contractAddress = item.token as Address;
  const isValidItemType = item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155;
  const isSupportedContract = isKnownTokenIssuingContract(config.namespace, {
    chainId,
    address: contractAddress,
  });

  return isValidItemType && isSupportedContract;
}

/**
 * Finds all payment items from offer array
 */
function findPaymentItemsInOffer(offer: readonly OfferItem[]): OfferItem[] {
  return offer.filter(
    (item) => item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20,
  );
}

/**
 * Finds all payment items from consideration array
 */
function findPaymentItemsInConsideration(
  consideration: readonly ConsiderationItem[],
): ConsiderationItem[] {
  return consideration.filter(
    (item) => item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20,
  );
}

/**
 * Main handler for Seaport OrderFulfilled events
 */
export async function handleOrderFulfilled({
  context,
  event,
}: {
  context: Context;
  event: SeaportOrderFulfilledEvent;
}) {
  const { offer, consideration } = event.args;

  // Check if this is a listing (NFT in offer, payment in consideration)
  const nftInOffer = offer.find((item) => isSupportedTokenTypeAndContract(item, context));
  const paymentItemsInConsideration = findPaymentItemsInConsideration(consideration);

  if (nftInOffer && paymentItemsInConsideration.length > 0) {
    await handleListingFulfilled(context, event, nftInOffer, paymentItemsInConsideration);
    return;
  }

  // Check if this is an offer (payment in offer, NFT in consideration)
  const paymentItemsInOffer = findPaymentItemsInOffer(offer);
  const nftInConsideration = consideration.find((item) =>
    isSupportedTokenTypeAndContract(item, context),
  );

  if (paymentItemsInOffer.length > 0 && nftInConsideration) {
    await handleOfferFulfilled(context, event, nftInConsideration, paymentItemsInOffer);
  }
}
