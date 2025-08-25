import { CurrencyIds, getCurrencyIdForContract } from "@/lib/currencies";
import { AssetNamespace, AssetNamespaces } from "@/lib/tokenscope/assets";
import { SupportedNFT, SupportedPayment, SupportedSale } from "@/lib/tokenscope/sales";
import {
  SeaportConsiderationItem,
  SeaportItemType,
  SeaportOfferItem,
  SeaportOrderFulfilledEvent,
} from "@/lib/tokenscope/seaport-types";
import { getKnownTokenIssuer } from "@/lib/tokenscope/token-issuers";
import { ENSNamespaceId } from "@ensnode/datasources";
import { ChainId, uniq } from "@ensnode/ensnode-sdk";

/**
 * Gets the supported TokenScope Asset Namespace for a given Seaport ItemType.
 *
 * @param itemType - The Seaport item type to get the supported TokenScope token type for
 * @returns the supported TokenScope Asset Namespace for the given Seaport ItemType, or null
 *          if the ItemType is not supported.
 */
const getAssetNamespace = (itemType: SeaportItemType): AssetNamespace | null => {
  switch (itemType) {
    case SeaportItemType.ERC721:
      return AssetNamespaces.ERC721;
    case SeaportItemType.ERC1155:
      return AssetNamespaces.ERC1155;
    default:
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
  const tokenType = getAssetNamespace(item.itemType);
  if (!tokenType) return null;

  // validate that the token is a known token issuing contract
  const tokenIssuer = getKnownTokenIssuer(namespaceId, {
    chainId,
    address: item.token,
  });
  if (!tokenIssuer) return null;

  const contract = tokenIssuer.contract;
  const tokenId = item.identifier;
  const domainId = tokenIssuer.getDomainId(tokenId);

  return {
    assetNamespace: tokenType,
    contract,
    tokenId,
    domainId,
  };
};

const getSupportedPayment = (
  namespaceId: ENSNamespaceId,
  chainId: ChainId,
  item: SeaportOfferItem | SeaportConsiderationItem,
): SupportedPayment | null => {
  // validate that the item is a supported currency
  const currencyId = getCurrencyIdForContract(namespaceId, {
    chainId,
    address: item.token,
  });

  if (!currencyId) return null; // Unsupported currency

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

  if (item.amount < 0n) return null; // Invalid amount

  return {
    price: {
      currency: currencyId,
      amount: item.amount,
    },
  };
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
  const extractions: SeaportItemExtractions = {
    nfts: [],
    payments: [],
  };

  // each item is either a supported NFT, a supported payment, or unsupported
  for (const item of items) {
    const nft = getSupportedNFT(namespaceId, chainId, item);
    if (nft) {
      extractions.nfts.push(nft);
    } else {
      const payment = getSupportedPayment(namespaceId, chainId, item);
      if (payment) {
        extractions.payments.push(payment);
      }
    }
  }

  return extractions;
};

const consolidateSupportedNFTs = (nfts: SupportedNFT[]): SupportedNFT | null => {
  // Either no NFT or multiple NFTs
  if (nfts.length !== 1) return null;
  return nfts[0]!;
};

const consolidateSupportedPayments = (payments: SupportedPayment[]): SupportedPayment | null => {
  // Get the set of distinct currencies in the payment
  const paymentCurrencies = payments.map((payment) => payment.price.currency);
  const uniqueCurrencies = uniq(paymentCurrencies);

  // Either no payment or multiple payments in mixed currencies
  if (uniqueCurrencies.length !== 1) return null;

  // consolidate multiple payments in the same currency into one.
  const totalAmount = payments.reduce((total, payment) => total + payment.price.amount, 0n);

  return {
    price: {
      currency: uniqueCurrencies[0]!, // we verified above there's exactly one currency
      amount: totalAmount,
    },
  };
};

/**
 * Maps from Seaport-specific OrderFulfilled event into our more generic TokenScope `SupportedSale`,
 * if possible. TokenScope aims to deliver a simpler datamodel than Seaport provides but still
 * support the majority of real-world use cases.
 */
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
      orderHash,
      nft: consolidatedOfferNFT,
      payment: consolidatedOfferPayment,
      seller: offerer,
      buyer: recipient,
    };
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
      orderHash,
      nft: consolidatedConsiderationNFT,
      payment: consolidatedConsiderationPayment,
      seller: recipient,
      buyer: offerer,
    };
  }

  // otherwise, unsupported sale
  return null;
};
