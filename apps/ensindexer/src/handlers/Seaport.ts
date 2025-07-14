import {Context} from "ponder:registry";
import schema from "ponder:schema";
import {ConsiderationItem, OfferItem} from "@opensea/seaport-js/lib/types";
import {ItemType} from "@opensea/seaport-js/lib/constants";

import {sharedEventValues, upsertAccount} from "@/lib/db-helpers";
import {EventWithArgs} from "@/lib/ponder-helpers";
import {upsertCurrency} from "@/lib/seaport/seaport-helpers";

// Supported contracts
const SUPPORTED_CONTRACTS = [
    "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
    "0x0635513f179D50A207757E05759CbD106d7dFcE8",
];

interface SeaportOrderFulfilledEvent extends EventWithArgs<{
    orderHash: string;
    offerer: string;
    zone: string;
    recipient: string;
    offer: OfferItem[];
    consideration: ConsiderationItem[];
}> {
}

/**
 * Handles NFT offers being fulfilled (someone accepting an offer)
 * In an offer: NFT holder accepts someone's offer to buy their NFT
 * - NFT is in consideration (what the offerer wants)
 * - Payment is in offer (what the offerer gives)
 */
async function handleOffer(
    context: Context,
    event: SeaportOrderFulfilledEvent,
    nftItem: ConsiderationItem,
    payment: OfferItem
) {
    const {orderHash, offerer, recipient} = event.args;

    // In an offer, the offerer is buying the NFT, recipient is selling
    const buyer = offerer;
    const seller = recipient;

    // Ensure accounts exist
    await upsertAccount(context, buyer);
    await upsertAccount(context, seller);

    // Get currency info
    const currencyId = await upsertCurrency(context, payment.token);

    // Record the sale
    await context.db.insert(schema.nameSold).values({
        ...sharedEventValues(context.chain.id, event),
        fromOwnerId: seller,
        newOwnerId: buyer,
        currencyId: currencyId,
        chainId: context.chain.id,
        orderHash: orderHash,
        price: BigInt(payment.amount),
        tokenContract: nftItem.token,
        tokenId: nftItem.identifier.toString(),
        itemType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    });
}

/**
 * Handles NFT listings being fulfilled (someone buying a listed item)
 * In a listing: NFT owner lists their NFT for sale
 * - NFT is in offer (what the offerer gives)
 * - Payment is in consideration (what the offerer wants)
 */
async function handleListing(
    context: Context,
    event: SeaportOrderFulfilledEvent,
    nftItem: OfferItem,
    payment: ConsiderationItem
) {
    const {orderHash, offerer, recipient} = event.args;

    // In a listing, the offerer is selling the NFT, recipient is buying
    const seller = offerer;
    const buyer = recipient;

    // Ensure accounts exist
    await upsertAccount(context, seller);
    await upsertAccount(context, buyer);

    // Get currency info
    const currencyId = await upsertCurrency(context, payment.token);

    // Record the sale
    await context.db.insert(schema.nameSold).values({
        ...sharedEventValues(context.chain.id, event),
        fromOwnerId: seller,
        newOwnerId: buyer,
        currencyId: currencyId,
        chainId: context.chain.id,
        orderHash: orderHash,
        price: BigInt(payment.amount),
        tokenContract: nftItem.token,
        tokenId: nftItem.identifier.toString(),
        itemType: nftItem.itemType === ItemType.ERC721 ? "ERC721" : "ERC1155",
    });
}

/**
 * Validates if an NFT item is supported
 */
function isValidNFTItem(item: OfferItem | ConsiderationItem): boolean {
    if (!item || !item.token) return false;

    const isValidItemType = item.itemType === ItemType.ERC721 || item.itemType === ItemType.ERC1155;
    const isSupportedContract = SUPPORTED_CONTRACTS.includes(item.token);

    return isValidItemType && isSupportedContract;
}

/**
 * Finds the payment item from offer or consideration arrays
 */
function findPaymentInOffer(offer: OfferItem[]): OfferItem | undefined {
    return offer.find(
        (item) => item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20
    );
}

/**
 * Finds the payment item from consideration array (only support NATIVE and ERC20)
 */
function findPaymentInConsideration(consideration: ConsiderationItem[]): ConsiderationItem | undefined {
    return consideration.find(
        (item) => item.itemType === ItemType.NATIVE || item.itemType === ItemType.ERC20
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
    const {offer, consideration} = event.args;

    // Check if this is a listing (NFT in offer, payment in consideration)
    const nftInOffer = offer.find(isValidNFTItem);
    const paymentInConsideration = findPaymentInConsideration(consideration);

    if (nftInOffer && paymentInConsideration) {
        await handleListing(context, event, nftInOffer, paymentInConsideration);
        return;
    }

    // Check if this is an offer (payment in offer, NFT in consideration)
    const paymentInOffer = findPaymentInOffer(offer);
    const nftInConsideration = consideration.find(isValidNFTItem);

    if (paymentInOffer && nftInConsideration) {
        await handleOffer(context, event, nftInConsideration, paymentInOffer);
        return;
    }
}