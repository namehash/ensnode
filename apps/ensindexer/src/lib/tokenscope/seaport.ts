import { CurrencyIds, getCurrencyIdForContract } from "@/lib/currencies";
import { makeEventId } from "@/lib/ids";
import {
  OnchainEventRef,
  SupportedNFT,
  SupportedPayment,
  SupportedSale,
} from "@/lib/tokenscope/sales";
import {
  SeaportConsiderationItem,
  SeaportItemType,
  SeaportOfferItem,
  SeaportOrderFulfilledEvent,
} from "@/lib/tokenscope/seaport-types";
import { getKnownTokenIssuer } from "@/lib/tokenscope/token-issuers";
import { TokenType, TokenTypes } from "@/lib/tokenscope/tokens";
import { ChainId, ENSNamespaceId } from "@ensnode/datasources";

/**
 * The file has the responsibility of maping from Seaport-specific data models into our more generic
 * TokenScope data models as found in the `@/lib/tokenscope-helpers` file.
 *
 * TokenScope aims to deliver a simpler datamodel than Seaport provides but still support the
 * majority of real-world use cases.
 */

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

export const getSupportedSaleFromOrderFulfilledEvent = (
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

  // offer is exactly 1 supported NFT and consideration consolidates to 1 supported payment
  // therefore the offerer is the seller and the recipient is the buyer
  if (
    consolidatedOfferNFT &&
    !consolidatedConsiderationNFT &&
    consolidatedOfferPayment &&
    !consolidatedConsiderationPayment
  ) {
    return {
      event: buildOnchainEventRef(chainId, event),
      orderHash,
      nft: consolidatedOfferNFT,
      payment: consolidatedOfferPayment,
      seller: offerer,
      buyer: recipient,
    } satisfies SupportedSale;
  }

  // consideration is exactly 1 supported NFT and offer consolidates to 1 supported payment
  // therefore the recipient is the seller and the offerer is the buyer
  if (
    !consolidatedOfferNFT &&
    consolidatedConsiderationNFT &&
    !consolidatedOfferPayment &&
    consolidatedConsiderationPayment
  ) {
    return {
      event: buildOnchainEventRef(chainId, event),
      orderHash,
      nft: consolidatedConsiderationNFT,
      payment: consolidatedConsiderationPayment,
      seller: recipient,
      buyer: offerer,
    } satisfies SupportedSale;
  }

  // otherwise, unsupported sale
  return null;
};
