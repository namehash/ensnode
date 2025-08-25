import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { ItemType } from "@opensea/seaport-js/lib/constants";

import config from "@/config";
import { sharedEventValues, upsertAccount } from "@/lib/db-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import {
  getDomainIdByTokenId,
  getSupportedCurrencies,
  isKnownTokenIssuingContract,
} from "@/lib/tokenscope-helpers";
import { NameSoldInsert, TokenTypes } from "@ensnode/ensnode-schema";
import { ChainId, uint256ToHex32 } from "@ensnode/ensnode-sdk";
import { Address, Hex, zeroAddress } from "viem";

type OfferItem = {
  /**
   * The type of item in the offer.
   * For example, ERC20, ERC721, ERC1155, or NATIVE (ETH)
   */
  itemType: ItemType;

  /**
   * The contract address of the token.
   * - For ERC721/ERC1155: The NFT contract address
   * - For ERC20: The token contract address
   * - For NATIVE (ETH): Zero address (0x0000000000000000000000000000000000000000)
   */
  token: Address;

  /**
   * The identifier field has different meanings based on itemType:
   * - For ERC721/ERC1155: The specific token ID of the NFT
   * - For ERC20: Always 0 (not used for fungible tokens)
   * - For NATIVE (ETH): Always 0 (not used for native currency)
   */
  identifier: bigint;

  /**
   * The amount field has different meanings based on itemType:
   * - For ERC721: Always 1 (you can only transfer 1 unique NFT)
   * - For ERC1155: The quantity of tokens with the specified identifier (for our purposes, always 1)
   * - For ERC20: The amount of tokens (in wei/smallest unit)
   * - For NATIVE (ETH): The amount of ETH (in wei)
   */
  amount: bigint;
};

type ConsiderationItem = {
  /**
   * The type of item in the consideration.
   * For example, ERC20, ERC721, ERC1155, or NATIVE (ETH)
   */
  itemType: ItemType;

  /**
   * The contract address of the token.
   * - For ERC721/ERC1155: The NFT contract address
   * - For ERC20: The token contract address
   * - For NATIVE (ETH): Zero address (0x0000000000000000000000000000000000000000)
   */
  token: Address;

  /**
   * The identifier field has different meanings based on itemType:
   * - For ERC721/ERC1155: The specific token ID of the NFT
   * - For ERC20: Always 0 (not used for fungible tokens)
   * - For NATIVE (ETH): Always 0 (not used for native currency)
   */
  identifier: bigint;

  /**
   * The amount field has different meanings based on itemType:
   * - For ERC721: Always 1 (you can only transfer 1 unique NFT)
   * - For ERC1155: The quantity of tokens with the specified identifier
   * - For ERC20: The amount of tokens (in wei/smallest unit)
   * - For NATIVE (ETH): The amount of ETH (in wei)
   */
  amount: bigint;

  /**
   * The address that receives the consideration items from the order.
   * This is typically the order fulfiller or their designated recipient.
   */
  recipient: Address;
};

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
 * Gets the currency symbol for a given address on a specific chain.
 */
function getCurrencySymbol(chainId: number, currencyAddress: Address): string | null {
  const supportedCurrencies = getSupportedCurrencies(chainId);

  if (currencyAddress === zeroAddress) {
    const ethCurrency = supportedCurrencies.find((currency) => currency.address === null);
    return ethCurrency?.symbol || null;
  }

  const matchingCurrency = supportedCurrencies.find(
    (currency) =>
      currency.address && currency.address.toLowerCase() === currencyAddress.toLowerCase(),
  );

  return matchingCurrency?.symbol || null;
}

/**
 * Checks if an item is a supported NFT (ERC721/ERC1155 from known contracts)
 */
function isSupportedNFT(chainId: number, item: OfferItem | ConsiderationItem): boolean {
  const isValidItemType = item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155;
  const isSupportedContract = isKnownTokenIssuingContract(config.namespace, {
    chainId,
    address: item.token,
  });

  return isValidItemType && isSupportedContract;
}

/**
 * Checks if an item is a payment token (ETH or ERC20)
 */
function isPaymentToken(item: OfferItem | ConsiderationItem): boolean {
  return item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20;
}

/**
 * Determines if a Seaport order fulfillment represents an indexable sale
 * and extracts the sale data if so.
 */
function getSaleIndexable(
  event: SeaportOrderFulfilledEvent,
  chainId: ChainId,
): NameSoldInsert | null {
  const { offer, consideration, orderHash, offerer, recipient } = event.args;

  // Find all NFTs and payment items
  const nftsInOffer = offer.filter((item) => isSupportedNFT(chainId, item));
  const nftsInConsideration = consideration.filter((item) => isSupportedNFT(chainId, item));
  const paymentsInOffer = offer.filter(isPaymentToken);
  const paymentsInConsideration = consideration.filter(isPaymentToken);

  let nftItem: OfferItem | ConsiderationItem;
  let paymentItems: (OfferItem | ConsiderationItem)[];
  let seller: Address;
  let buyer: Address;

  // Determine transaction type and validate structure
  if (
    nftsInOffer.length === 1 &&
    nftsInConsideration.length === 0 &&
    paymentsInConsideration.length > 0
  ) {
    // Listing: NFT in offer, payment in consideration
    nftItem = nftsInOffer[0]!;
    paymentItems = paymentsInConsideration;
    seller = offerer;
    buyer = recipient;
  } else if (
    nftsInConsideration.length === 1 &&
    nftsInOffer.length === 0 &&
    paymentsInOffer.length > 0
  ) {
    // Offer: payment in offer, NFT in consideration
    nftItem = nftsInConsideration[0]!;
    paymentItems = paymentsInOffer;
    seller = recipient;
    buyer = offerer;
  } else {
    // Invalid structure
    return null;
  }

  // Validate payment structure
  if (paymentItems.length === 0) {
    return null;
  }

  // Check for mixed currencies
  const paymentTokens = paymentItems.map((item) => item.token.toLowerCase());
  const uniqueTokens = [...new Set(paymentTokens)];
  if (uniqueTokens.length > 1) {
    return null; // Mixed currencies not supported
  }

  const currencyAddress = paymentItems[0]!.token;
  const currencySymbol = getCurrencySymbol(chainId, currencyAddress);
  if (!currencySymbol) {
    return null; // Unsupported currency
  }

  // Calculate total payment amount
  const totalAmount = paymentItems.reduce((total, item) => total + item.amount, 0n);
  if (totalAmount <= 0n) {
    return null;
  }

  // Extract NFT details
  const contractAddress = nftItem.token;
  const tokenId = nftItem.identifier.toString();
  const tokenIdHex = uint256ToHex32(BigInt(tokenId));

  // Get domain ID
  let domainId;
  try {
    domainId = getDomainIdByTokenId(chainId, config.namespace, contractAddress, tokenIdHex);
  } catch (e) {
    // should we log here?
    return null;
  }

  return {
    ...sharedEventValues(chainId, event),
    logIndex: event.log.logIndex,
    chainId,
    orderHash,
    timestamp: event.block.timestamp,
    fromOwnerId: seller,
    newOwnerId: buyer,
    contractAddress: contractAddress,
    tokenId: tokenId,
    tokenType: nftItem.itemType === ItemType.ERC721 ? TokenTypes.ERC721 : TokenTypes.ERC1155,
    domainId,
    currency: currencySymbol,
    price: totalAmount,
  };
}

/**
 * Processes a validated sale transaction
 */
async function handleSale(context: Context, saleData: NameSoldInsert): Promise<void> {
  // Ensure accounts exist
  await upsertAccount(context, saleData.fromOwnerId);
  await upsertAccount(context, saleData.newOwnerId);

  // Record the sale
  await context.db.insert(schema.nameSold).values(saleData);
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
  const indexableSale = getSaleIndexable(event, context.chain.id);
  if (indexableSale) {
    await handleSale(context, indexableSale);
  }
}
