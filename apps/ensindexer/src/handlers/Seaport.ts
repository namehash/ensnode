import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { ItemType } from "@opensea/seaport-js/lib/constants";

import { sharedEventValues, upsertAccount } from "@/lib/db-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { lookupDomainId, upsertCurrency } from "@/lib/seaport/seaport-helpers";
import { replaceBigInts } from "ponder";
import { Address, Hex } from "viem";

// Supported contracts
const SUPPORTED_CONTRACTS: Address[] = [
  "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  "0x0635513f179D50A207757E05759CbD106d7dFcE8",
];

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

/**
 * Validates that all payment items use the same currency
 */
function validateCurrencyConsistency(paymentItems: Item[]): boolean {
  if (paymentItems.length === 0) {
    return false;
  }

  // Get all unique tokens used in payment items
  const paymentTokens = paymentItems.map((item) => item.token);
  const uniqueTokens = [...new Set(paymentTokens)];

  // Return false if mixed currencies found
  return uniqueTokens.length === 1;
}

/**
 * Calculates the total payment amount from all items
 */
function getTotalPaymentAmount(items: Item[]): bigint {
  return items.reduce((total, item) => total + item.amount, 0n);
}

/**
 * Handles NFT offers being fulfilled (someone accepting an offer)
 */
async function handleOfferFulfilled(
  context: Context,
  event: SeaportOrderFulfilledEvent,
  nftItem: ConsiderationItem,
  paymentItems: OfferItem[],
) {
  const { orderHash, offerer, recipient } = event.args;

  // In an offer, the offerer is buying the NFT, recipient is selling
  const buyer = offerer;
  const seller = recipient;

  // Ensure accounts exist
  await upsertAccount(context, buyer);
  await upsertAccount(context, seller);

  // Validate currency consistency
  if (!validateCurrencyConsistency(paymentItems)) {
    // TODO: log mixed currencies error
    return;
  }

  // Calculate total payment amount
  const totalAmount = getTotalPaymentAmount(paymentItems);
  const currencyToken = paymentItems[0].token;

  // Get currency info
  const currencyId = await upsertCurrency(context, currencyToken);

  const contractAddress = nftItem.token as Address;
  const tokenId = nftItem.identifier.toString();

  // Get Domain ID
  const domainId = await lookupDomainId(context, contractAddress, tokenId);

  if (!domainId) {
    // TODO: log
    return;
  }

  // Record the sale
  await context.db.insert(schema.nameSold).values({
    ...sharedEventValues(context.chain.id, event),
    fromOwnerId: seller,
    newOwnerId: buyer,
    currencyId: currencyId,
    chainId: context.chain.id,
    orderHash: orderHash,
    price: totalAmount,
    contractAddress: contractAddress,
    tokenId: tokenId,
    itemType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    domainId: domainId,
    createdAt: event.block.timestamp,
    eventData: replaceBigInts(event.args, (v) => v.toString()),
  });
}

/**
 * Handles NFT listings being fulfilled (someone buying a listed item)
 */
async function handleListingFulfilled(
  context: Context,
  event: SeaportOrderFulfilledEvent,
  nftItem: OfferItem,
  paymentItems: ConsiderationItem[],
) {
  const { orderHash, offerer, recipient } = event.args;

  // In a listing, the offerer is selling the NFT, recipient is buying
  const seller = offerer;
  const buyer = recipient;

  // Ensure accounts exist
  await upsertAccount(context, seller);
  await upsertAccount(context, buyer);

  // Validate currency consistency
  if (!validateCurrencyConsistency(paymentItems)) {
    // TODO: log mixed currencies error
    return;
  }

  // Calculate total payment amount
  const totalAmount = getTotalPaymentAmount(paymentItems);
  const currencyToken = paymentItems[0].token;

  // Get currency info
  const currencyId = await upsertCurrency(context, currencyToken);

  const contractAddress = nftItem.token as Address;
  const tokenId = nftItem.identifier.toString();

  // Get domain ID
  let domainId = await lookupDomainId(context, contractAddress, tokenId);

  if (!domainId) {
    // TODO: log
    return;
  }

  // Record the sale
  await context.db.insert(schema.nameSold).values({
    ...sharedEventValues(context.chain.id, event),
    fromOwnerId: seller,
    newOwnerId: buyer,
    currencyId: currencyId,
    chainId: context.chain.id,
    orderHash: orderHash,
    price: totalAmount,
    contractAddress: contractAddress,
    tokenId: tokenId,
    itemType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    domainId: domainId,
    createdAt: event.block.timestamp,
    eventData: replaceBigInts(event.args, (v) => v.toString()),
  });
}

/**
 * Validates if an NFT item is supported
 */
function isIndexable(item: OfferItem | ConsiderationItem): boolean {
  if (!item || !item.token) return false;

  const contractAddress = item.token as Address;
  const isValidItemType = item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155;
  const isSupportedContract = SUPPORTED_CONTRACTS.includes(contractAddress);

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
  const nftInOffer = offer.find(isIndexable);
  const paymentItemsInConsideration = findPaymentItemsInConsideration(consideration);

  if (nftInOffer && paymentItemsInConsideration.length > 0) {
    await handleListingFulfilled(context, event, nftInOffer, paymentItemsInConsideration);
    return;
  }

  // Check if this is an offer (payment in offer, NFT in consideration)
  const paymentItemsInOffer = findPaymentItemsInOffer(offer);
  const nftInConsideration = consideration.find(isIndexable);

  if (paymentItemsInOffer.length > 0 && nftInConsideration) {
    await handleOfferFulfilled(context, event, nftInConsideration, paymentItemsInOffer);
    return;
  }

  // If we reach here, it's not a supported order type
  // TODO: log unsupported order type
}
