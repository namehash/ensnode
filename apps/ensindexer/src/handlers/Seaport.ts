import { Context } from "ponder:registry";
import { ItemType as SeaportItemType } from "@opensea/seaport-js/lib/constants";

import config from "@/config";
import { EventWithArgs } from "@/lib/ponder-helpers";
import {
  CurrencyIds,
  OnchainEventRef,
  SupportedNFT,
  SupportedPayment,
  SupportedSale,
  TokenType,
  TokenTypes,
  getCurrencyIdForContract,
  getKnownTokenIssuer,
  indexSupportedSale,
  makeEventId,
} from "@/lib/tokenscope-helpers";
import { ChainId, ENSNamespaceId } from "@ensnode/datasources";
import { Address, Hex } from "viem";

/**
 * The file has the responsibility for logic that maps from Seaport-specific data models
 * into our more generic TokenScope data models as found in the `@/lib/tokenscope-helpers` file.
 * 
 * Seaport's data model supports complexity that has more negatives than benefits. TokenScope aims
 * to deliver a more simple data model for developers to build ENS apps with. This simplified data
 * model is anticipated to still support the vast majority of real-world use cases.
 * 
 * In this file we examine each indexed Seaport event to determine if it fits within the TokenScope
 * data model. If it does, we extract the relevant data and map it into the TokenScope data model.
 * 
 * If it does not, we ignore the event.
 */

type SeaportOfferItem = {
  /**
   * The type of item in the offer.
   * For example, ERC20, ERC721, ERC1155, or NATIVE (ETH)
   */
  itemType: SeaportItemType;

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

type SeaportConsiderationItem = {
  /**
   * The type of item in the consideration.
   * For example, ERC20, ERC721, ERC1155, or NATIVE (ETH)
   */
  itemType: SeaportItemType;

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
     * The unique hash identifier of the fulfilled order within Seaport.
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
    offer: readonly SeaportOfferItem[];

    /**
     * Array of items that the offerer expects to receive in return.
     * For listings: ETH/ERC20 tokens expected as payment
     * For offers: NFTs/tokens being requested in exchange
     */
    consideration: readonly SeaportConsiderationItem[];
  }> {}

/**
 * Gets the supported TokenScope token type for a given Seaport item type.
 *
 * @param itemType - The Seaport item type to get the supported TokenScope token type for
 * @returns the supported TokenScope token type for the given SeaPort item type, or null
 *          if the item type is not supported
 */
const getSupportedTokenType = (itemType: SeaportItemType): TokenType | null => {
  if (itemType === SeaportItemType.ERC721) {
    return TokenTypes.ERC721;
  } else if (itemType === SeaportItemType.ERC1155) {
    return TokenTypes.ERC1155;
  } else {
    return null;
  }
};

/**
 * Gets the supported NFT from a given Seaport item.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param chainId - The chain ID of the Seaport item
 * @param item - The Seaport item to get the supported NFT from
 * @returns the supported NFT from the given Seaport item, or `null` if the Seaport item is
 *          not a supported NFT
 */
const getSupportedNFT = (
  namespaceId: ENSNamespaceId,
  chainId: ChainId,
  item: SeaportOfferItem | SeaportConsiderationItem,
): SupportedNFT | null => {
  // validate item as an ERC721/ERC1155 NFT
  const tokenType = getSupportedTokenType(item.itemType);
  if (!tokenType) {
    return null;
  }

  // validate that the token is a known token issuing contract
  const tokenIssuer = getKnownTokenIssuer(namespaceId, {
    chainId,
    address: item.token,
  });
  if (!tokenIssuer) {
    return null;
  }

  const contract = tokenIssuer.contract;
  const tokenId = item.identifier;
  const domainId = tokenIssuer.getDomainId(tokenId);

  return {
    tokenType,
    contract,
    tokenId,
    domainId,
  } satisfies SupportedNFT;
};

const getSupportedPayment = (
  namespaceId: ENSNamespaceId,
  chainId: ChainId,
  item: SeaportOfferItem | SeaportConsiderationItem,
): SupportedPayment | null => {
  const currencyContract = {
    chainId,
    address: item.token,
  };

  // validate that the item is a supported currency
  const currencyId = getCurrencyIdForContract(namespaceId, currencyContract);
  if (!currencyId) {
    return null; // Unsupported currency
  }

  // validate the Seaport item type is supported and matches the currencyId
  if (item.itemType === SeaportItemType.NATIVE) {
    if (currencyId !== CurrencyIds.ETH) {
      return null; // Seaport item type doesn't match currencyId
    }
  } else if (item.itemType === SeaportItemType.ERC20) {
    if (currencyId === CurrencyIds.ETH) {
      return null; // Seaport item type doesn't match currencyId
    }
  } else {
    // unsupported Seaport item type
    return null;
  }

  if (item.amount < 0n) {
    return null; // Invalid amount
  }

  return {
    price: {
      currency: currencyId,
      amount: item.amount,
    },
  } satisfies SupportedPayment;
};

interface SeaportItemExtractions {
  nfts: SupportedNFT[];

  /**
   * Seaport supports multiple payments in a single order.
   * 
   * Example cases include:
   * - Payments are being made in multiple currencies.
   * - Multiple payments in the same currency, but where payment is for marketplace fees while
   *   other payments are for the seller.
   */
  payments: SupportedPayment[];
}

const getSeaportItemExtractions = (
  namespaceId: ENSNamespaceId,
  chainId: ChainId,
  items: readonly (SeaportOfferItem | SeaportConsiderationItem)[],
): SeaportItemExtractions => {
  let nfts: SupportedNFT[] = [];
  let payments: SupportedPayment[] = [];

  // each item is either a supported NFT, a supported payment, or unsupported
  for (const item of items) {
    const nft = getSupportedNFT(namespaceId, chainId, item);
    if (nft) {
      nfts.push(nft);
    } else {
      const payment = getSupportedPayment(namespaceId, chainId, item);
      if (payment) {
        payments.push(payment);
      }
    }
  }

  return {
    nfts,
    payments,
  } satisfies SeaportItemExtractions;
};

const consolidateSupportedNFTs = (nfts: SupportedNFT[]): SupportedNFT | null => {
  if (nfts.length !== 1) {
    return null; // Either no NFT or multiple NFTs
  }

  return nfts[0]!;
};

const consolidateSupportedPayments = (payments: SupportedPayment[]): SupportedPayment | null => {
  // Get the set of distinct currencies in the payment
  const paymentCurrencies = payments.map((payment) => payment.price.currency);
  const uniqueCurrencies = [...new Set(paymentCurrencies)];
  if (uniqueCurrencies.length !== 1) {
    return null; // Either no payment or multiple payments in mixed currencies
  }

  // consolidate multiple payments in the same currency into one.
  const totalAmount = payments.reduce((total, payment) => total + payment.price.amount, 0n);

  return {
    price: {
      currency: uniqueCurrencies[0]!, // we verified above there's exactly one currency
      amount: totalAmount,
    },
  } satisfies SupportedPayment;
};

const buildOnchainEventRef = (
  chainId: ChainId,
  event: SeaportOrderFulfilledEvent,
): OnchainEventRef => {
  if (event.block.timestamp > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Error building onchain event ref: block timestamp is too large: ${event.block.timestamp}`,
    );
  }
  if (event.block.number > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Error building onchain event ref: block number is too large: ${event.block.number}`,
    );
  }
  const blockNumber = Number(event.block.number);
  const timestamp = Number(event.block.timestamp);

  return {
    eventId: makeEventId(chainId, event.block.number, event.log.logIndex),
    chainId,
    blockNumber,
    logIndex: event.log.logIndex,
    timestamp,
    transactionHash: event.transaction.hash,
  } satisfies OnchainEventRef;
};

const getSupportedSale = (
  namespaceId: ENSNamespaceId,
  chainId: ChainId,
  event: SeaportOrderFulfilledEvent,
): SupportedSale | null => {
  const { offer, consideration, orderHash, offerer, recipient } = event.args;

  const { nfts: offerNFTs, payments: offerPayments } = getSeaportItemExtractions(
    namespaceId,
    chainId,
    offer,
  );
  const { nfts: considerationNFTs, payments: considerationPayments } = getSeaportItemExtractions(
    namespaceId,
    chainId,
    consideration,
  );

  const consolidatedOfferNFT = consolidateSupportedNFTs(offerNFTs);
  const consolidatedConsiderationNFT = consolidateSupportedNFTs(considerationNFTs);
  const consolidatedOfferPayment = consolidateSupportedPayments(offerPayments);
  const consolidatedConsiderationPayment = consolidateSupportedPayments(considerationPayments);

  if (
    consolidatedOfferNFT &&
    !consolidatedConsiderationNFT &&
    consolidatedOfferPayment &&
    !consolidatedConsiderationPayment
  ) {
    // offer is exactly 1 supported NFT and consideration consolidates to 1 supported payment
    // therefore the offerer is the seller and the recipient is the buyer
    return {
      event: buildOnchainEventRef(chainId, event),
      orderHash,
      nft: consolidatedOfferNFT,
      payment: consolidatedOfferPayment,
      seller: offerer,
      buyer: recipient,
    } satisfies SupportedSale;
  } else if (
    !consolidatedOfferNFT &&
    consolidatedConsiderationNFT &&
    !consolidatedOfferPayment &&
    consolidatedConsiderationPayment
  ) {
    // consideration is exactly 1 supported NFT and offer consolidates to 1 supported payment
    // therefore the recipient is the seller and the offerer is the buyer
    return {
      event: buildOnchainEventRef(chainId, event),
      orderHash,
      nft: consolidatedConsiderationNFT,
      payment: consolidatedConsiderationPayment,
      seller: recipient,
      buyer: offerer,
    } satisfies SupportedSale;
  } else {
    // unsupported sale
    return null;
  }
};

/**
 * Handles each Seaport OrderFulfilled event
 */
export async function handleOrderFulfilled({
  context,
  event,
}: {
  context: Context;
  event: SeaportOrderFulfilledEvent;
}) {
  const supportedSale = getSupportedSale(config.namespace, context.chain.id, event);
  if (supportedSale) {
    await indexSupportedSale(context, supportedSale);
  }
}
