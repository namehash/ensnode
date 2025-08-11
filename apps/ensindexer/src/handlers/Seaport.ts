import {Context} from "ponder:registry";
import schema from "ponder:schema";
import {ItemType} from "@opensea/seaport-js/lib/constants";

import config from "@/config";
import {sharedEventValues, upsertAccount} from "@/lib/db-helpers";
import {EventWithArgs} from "@/lib/ponder-helpers";
import {getDomainIdByTokenId, isKnownTokenIssuingContract} from "@ensnode/datasources";
import {Address, Hex} from "viem";
import {uint256ToHex32} from "@ensnode/ensnode-sdk";

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
    }> {
}

type PaymentDetails = {
    currencyAddress: Address;
    totalAmount: bigint;
};

/**
 * Validates and extracts payment details from payment items.
 * Returns null if validation fails (no items, mixed currencies, etc.)
 */
function validateAndGetPaymentDetails(paymentItems: Item[]): PaymentDetails | null {
    // No payment items
    if (paymentItems.length === 0) {
        return null;
    }

    // Get all unique tokens used in payment items
    const paymentTokens = paymentItems.map((item) => item.token);
    const uniqueTokens = [...new Set(paymentTokens)];

    // Mixed currencies - not supported
    if (uniqueTokens.length > 1) {
        return null;
    }

    // No currency (shouldn't happen if we have items, but being safe)
    if (uniqueTokens.length === 0) {
        return null;
    }

    // Calculate total payment amount
    const totalAmount = paymentItems.reduce((total, item) => total + item.amount, 0n);

    // Validate amount is positive
    if (totalAmount <= 0n) {
        return null;
    }

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
    // Get payment details
    const paymentDetails = validateAndGetPaymentDetails(paymentItems)!;

    const {orderHash, offerer, recipient} = event.args;

    // In a fulfilled offer, the offerer is buying the NFT, recipient is selling
    const buyer = offerer;
    const seller = recipient;

    // Ensure accounts exist
    await upsertAccount(context, buyer);
    await upsertAccount(context, seller);

    const contractAddress = nftItem.token;
    const tokenId = nftItem.identifier.toString();

    // Get Domain ID
    const tokenIdHex = uint256ToHex32(BigInt(tokenId));
    const domainId = getDomainIdByTokenId(config.namespace, contractAddress, tokenIdHex);

    // Record the sale
    await context.db.insert(schema.nameSold).values({
        ...sharedEventValues(context.chain.id, event),
        fromOwnerId: seller,
        newOwnerId: buyer,
        currencyAddress: paymentDetails.currencyAddress,
        chainId: context.chain.id,
        logIndex: event.log.logIndex,
        orderHash: orderHash,
        price: paymentDetails.totalAmount,
        contractAddress: contractAddress,
        tokenId: tokenId,
        tokenType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
        domainId: domainId,
        timestamp: event.block.timestamp,
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
    // Get payment details
    const paymentDetails = validateAndGetPaymentDetails(paymentItems)!;

    const {orderHash, offerer, recipient} = event.args;

    // In a fulfilled listing, the offerer is selling the NFT, recipient is buying
    const seller = offerer;
    const buyer = recipient;

    // Ensure accounts exist
    await upsertAccount(context, seller);
    await upsertAccount(context, buyer);

    const contractAddress = nftItem.token;
    const tokenId = nftItem.identifier.toString();

    // Get domain ID
    const tokenIdHex = uint256ToHex32(BigInt(tokenId));
    const domainId = getDomainIdByTokenId(config.namespace, contractAddress, tokenIdHex);

    // Record the sale
    await context.db.insert(schema.nameSold).values({
        ...sharedEventValues(context.chain.id, event),
        fromOwnerId: seller,
        newOwnerId: buyer,
        currencyAddress: paymentDetails.currencyAddress,
        chainId: context.chain.id,
        logIndex: event.log.logIndex,
        orderHash: orderHash,
        price: paymentDetails.totalAmount,
        contractAddress: contractAddress,
        tokenId: tokenId,
        tokenType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
        domainId: domainId,
        timestamp: event.block.timestamp,
    });
}

/**
 * Checks if the item is an ERC721 or ERC1155 item
 * and if the token contract is a known token contract
 */
function isSupportedTokenTypeAndContract(
    chainId: number,
    item: OfferItem | ConsiderationItem,
): boolean {
    const contractAddress = item.token;
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
 * Validates if we have a valid listing scenario:
 * - Exactly one supported NFT in offer
 * - At least one payment item in consideration
 * - Valid payment configuration
 */
function validateListing(
    chainId: number,
    offer: readonly OfferItem[],
    consideration: readonly ConsiderationItem[],
): { nftItem: OfferItem; paymentItems: ConsiderationItem[] } | null {
    // Find NFTs in offer (should be exactly one for our use case)
    const nftsInOffer = offer.filter((item) => isSupportedTokenTypeAndContract(chainId, item));
    if (nftsInOffer.length !== 1) {
        return null; // We only support single NFT listings
    }

    const paymentItems = findPaymentItemsInConsideration(consideration);
    if (paymentItems.length === 0) {
        return null; // No payment items
    }

    // Pre-validate payment configuration
    const paymentDetails = validateAndGetPaymentDetails(paymentItems);
    if (!paymentDetails) {
        return null; // Invalid payment configuration
    }

    return {
        nftItem: nftsInOffer[0]!,
        paymentItems,
    };
}

/**
 * Validates if we have a valid offer scenario:
 * - At least one payment item in offer
 * - Exactly one supported NFT in consideration
 * - Valid payment configuration
 */
function validateOffer(
    chainId: number,
    offer: readonly OfferItem[],
    consideration: readonly ConsiderationItem[],
): { nftItem: ConsiderationItem; paymentItems: OfferItem[] } | null {
    const paymentItems = findPaymentItemsInOffer(offer);
    if (paymentItems.length === 0) {
        return null; // No payment items
    }

    // Find NFTs in consideration (should be exactly one for our use case)
    const nftsInConsideration = consideration.filter((item) =>
        isSupportedTokenTypeAndContract(chainId, item),
    );
    if (nftsInConsideration.length !== 1) {
        return null; // We only support single NFT offers
    }

    // Pre-validate payment configuration
    const paymentDetails = validateAndGetPaymentDetails(paymentItems);
    if (!paymentDetails) {
        return null; // Invalid payment configuration
    }

    return {
        nftItem: nftsInConsideration[0]!,
        paymentItems,
    };
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
    const {offer, consideration} = event.args;
    const chainId = context.chain.id;

    // Try to validate as a listing first
    const listingValidation = validateListing(chainId, offer, consideration);
    if (listingValidation) {
        await handleListingFulfilled(context, event, listingValidation.nftItem, listingValidation.paymentItems);
        return;
    }

    // Try to validate as an offer
    const offerValidation = validateOffer(chainId, offer, consideration);
    if (offerValidation) {
        await handleOfferFulfilled(context, event, offerValidation.nftItem, offerValidation.paymentItems);
        return;
    }
}