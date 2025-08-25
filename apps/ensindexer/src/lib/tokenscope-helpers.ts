import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { upsertAccount } from "@/lib/db-helpers";
import {
  ChainAddress,
  ChainId,
  DatasourceNames,
  ENSNamespaceId,
  getChainIdsForNamespace,
  isChainAddressEqual,
  maybeGetDatasourceContractChainAddress,
} from "@ensnode/datasources";
import {
  BASENAMES_NODE,
  ETH_NODE,
  LINEANAMES_NODE,
  LabelHash,
  type Node,
  UnixTimestamp,
  makeSubdomainNode,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";
import { Address, Hex, zeroAddress } from "viem";
import {
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  sepolia,
} from "viem/chains";

export const TokenTypes = {
  ERC721: "ERC721",
  ERC1155: "ERC1155",
} as const;

export type TokenType = (typeof TokenTypes)[keyof typeof TokenTypes];

/**
 * A uint256 value that identifies a specific token within a NFT contract.
 */
export type TokenId = bigint;

/**
 * A contract that issues tokenized ENS names.
 */
export interface TokenIssuer {
  /**
   * The ChainAddress of the token issuer contract.
   */
  contract: ChainAddress;

  /**
   * Applies the token issuer contract's logic for converting from the token id
   * representation of a domain to the domain id (Node) representation of a domain.
   */
  getDomainId: (tokenId: TokenId) => Node;
}

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using namehash of
 * the full name.
 *
 * @param tokenId - The tokenId to convert
 * @returns The Node of the tokenId
 */
export const nameHashGeneratedTokenIdToNode = (tokenId: TokenId): Node => {
  return uint256ToHex32(tokenId);
};

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using labelhash of
 * the direct subname of the parent node.
 *
 * @param tokenId - The tokenId to convert
 * @param parentNode - the parent Node that the token issuing contract issues subnames under
 * @returns The Node of the tokenId issued under the parentNode
 */
export const labelHashGeneratedTokenIdToNode = (tokenId: TokenId, parentNode: Node): Node => {
  const labelHash: LabelHash = uint256ToHex32(tokenId);
  return makeSubdomainNode(labelHash, parentNode);
};

/**
 * Gets the contracts known to provide tokenized name ownership within the
 * specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more known TokenIssuer for the specified namespace
 */
export const getKnownTokenIssuers = (namespaceId: ENSNamespaceId): TokenIssuer[] => {
  const ethBaseRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );
  const nameWrapper = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );
  const threeDnsBaseRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ThreeDNSBase,
    "ThreeDNSToken",
  );
  const threeDnsOptimismRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.ThreeDNSOptimism,
    "ThreeDNSToken",
  );
  const lineanamesRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.Lineanames,
    "BaseRegistrar",
  );
  const basenamesRegistrar = maybeGetDatasourceContractChainAddress(
    namespaceId,
    DatasourceNames.Basenames,
    "BaseRegistrar",
  );

  const result: TokenIssuer[] = [];

  if (ethBaseRegistrar) {
    result.push({
      contract: ethBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, ETH_NODE);
      },
    });
  }

  if (nameWrapper) {
    result.push({
      contract: nameWrapper,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsBaseRegistrar) {
    result.push({
      contract: threeDnsBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsOptimismRegistrar) {
    result.push({
      contract: threeDnsOptimismRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (lineanamesRegistrar) {
    result.push({
      contract: lineanamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, LINEANAMES_NODE);
      },
    });
  }

  if (basenamesRegistrar) {
    result.push({
      contract: basenamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, BASENAMES_NODE);
      },
    });
  }

  return result;
};

/**
 * Gets the known token issuer for the given ChainAddress in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param contract - The ChainAddress to get the known token issuer for
 * @returns the known token issuer for the given ChainAddress, or null
 *          if the ChainAddress is not a known token issuer in the specified namespace
 */
export const getKnownTokenIssuer = (
  namespaceId: ENSNamespaceId,
  contract: ChainAddress,
): TokenIssuer | null => {
  const tokenIssuers = getKnownTokenIssuers(namespaceId);
  return (
    tokenIssuers.find((tokenIssuer) => isChainAddressEqual(tokenIssuer.contract, contract)) ?? null
  );
};

/**
 * Identifies if the provided ChainAddress is a known token issuer.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param chainAddress - The ChainAddress to check
 * @returns a boolean indicating if the provided ChainAddress is a known token issuer in
 *          the specified namespace.
 */
export const isKnownTokenIssuer = (
  namespaceId: ENSNamespaceId,
  chainAddress: ChainAddress,
): boolean => {
  return getKnownTokenIssuer(namespaceId, chainAddress) !== null;
};

/**
 * Gets the domainId (Node) for a given NFT from contract with tokenId on the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param contract - The ChainAddress of the NFT contract
 * @param tokenId - The tokenId of the NFT
 * @returns the domainId (Node) for ENS name associated with the NFT
 * @throws an error if the contract is not a known token issuing contract in the specified namespace
 */
export function getDomainIdByTokenId(
  namespaceId: ENSNamespaceId,
  contract: ChainAddress,
  tokenId: TokenId,
): Node {
  const tokenIssuers = getKnownTokenIssuers(namespaceId);
  const tokenIssuer = tokenIssuers.find((tokenIssuer) =>
    isChainAddressEqual(tokenIssuer.contract, contract),
  );
  if (!tokenIssuer) {
    throw new Error(
      `The contract at address ${contract.address} on chain ${contract.chainId} is not a known token issuer in the ${namespaceId} namespace`,
    );
  }

  return tokenIssuer.getDomainId(tokenId);
}

/**
 * Makes a unique and deterministic event id.
 *
 * @example `${chainId}-${blockNumber}-${logIndex}`
 *
 * @param chainId
 * @param blockNumber
 * @param logIndex
 * @returns a unique and deterministic event id.
 */
export const makeEventId = (chainId: ChainId, blockNumber: bigint, logIndex: number) =>
  [chainId.toString(), blockNumber.toString(), logIndex.toString()].join("-");

/**
 * Makes a unique and deterministic TokenRef.
 *
 * @example `${chainId}-${contractAddress}-${tokenId}`
 *
 * @param chainId
 * @param contractAddress
 * @param tokenId
 * @returns a unique and deterministic TokenRef
 */
export const makeTokenRef = (chainId: ChainId, contractAddress: Address, tokenId: TokenId) =>
  `${chainId}-${contractAddress}-${uint256ToHex32(tokenId)}`;

// TODO: Add support for WETH
/**
 * Identifiers for supported currencies.
 */
export const CurrencyIds = {
  ETH: "ETH",
  USDC: "USDC",
  DAI: "DAI",
} as const;

export type CurrencyId = (typeof CurrencyIds)[keyof typeof CurrencyIds];

export interface Price {
  currency: CurrencyId;

  /**
   * The amount of the currency in the smallest unit of the currency. (see
   * decimals of the CurrencyConfig for the currency).
   *
   * Guaranteed to be non-negative.
   */
  amount: bigint;
}

export interface CurrencyConfig {
  id: CurrencyId;
  name: string;
  decimals: number;
}

const currencyConfigs: Record<CurrencyId, CurrencyConfig> = {
  [CurrencyIds.ETH]: {
    id: CurrencyIds.ETH,
    name: "Ethereum",
    decimals: 18,
  },
  [CurrencyIds.USDC]: {
    id: CurrencyIds.USDC,
    name: "USD Coin",
    decimals: 6,
  },
  [CurrencyIds.DAI]: {
    id: CurrencyIds.DAI,
    name: "Dai Stablecoin",
    decimals: 18,
  },
} as const;

export const getCurrencyConfig = (currencyId: CurrencyId): CurrencyConfig => {
  return currencyConfigs[currencyId];
};

// NOTE: this mapping currently only considers the subset of chains where we have
// supported token issuing contracts.
const knownCurrencyContracts: Record<ChainId, Record<CurrencyId, Address>> = {
  /** mainnet namespace */
  [mainnet.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0xA0b86a33E6417c5Dd4Baf8C54e5de49E293E9169",
    [CurrencyIds.DAI]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  [base.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [CurrencyIds.DAI]: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
  [optimism.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    [CurrencyIds.DAI]: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  [linea.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    [CurrencyIds.DAI]: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5",
  },
  /** sepolia namespace */
  [sepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    [CurrencyIds.DAI]: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
  },
  [baseSepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    [CurrencyIds.DAI]: "0x7368C6C68a4b2b68F90DB2e8F5E3b8E1E5e4F5c7",
  },
  [lineaSepolia.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    [CurrencyIds.DAI]: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5",
  },
  [holesky.id]: {
    [CurrencyIds.ETH]: zeroAddress,
    [CurrencyIds.USDC]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    [CurrencyIds.DAI]: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
  },
} as const;

/**
 * Gets the supported currency contracts for a given chain.
 *
 * @param chainId - The chain ID to get supported currency contracts for
 * @returns a record of currency ids to ChainAddresses for the given chain
 */
export const getSupportedCurrencyContractsForChain = (
  chainId: ChainId,
): Record<CurrencyId, ChainAddress> => {
  let result = {} as Record<CurrencyId, ChainAddress>;

  const knownCurrencyContractsForChain = knownCurrencyContracts[chainId];
  if (!knownCurrencyContractsForChain) {
    return result;
  }

  for (const [currencyId, address] of Object.entries(knownCurrencyContractsForChain)) {
    result[currencyId as CurrencyId] = {
      address,
      chainId,
    } as ChainAddress;
  }

  return result;
};

/**
 * Gets the supported currency contracts for a given namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 * 'ens-test-env')
 * @returns a record of currency ids to ChainAddresses for the given namespace
 */
export const getSupportedCurrencyContractsForNamespace = (
  namespaceId: ENSNamespaceId,
): Record<CurrencyId, ChainAddress> => {
  let result = {} as Record<CurrencyId, ChainAddress>;
  const chainIds = getChainIdsForNamespace(namespaceId);
  for (const chainId of chainIds) {
    const supportedCurrencyContractsForChain = getSupportedCurrencyContractsForChain(chainId);
    result = { ...result, ...supportedCurrencyContractsForChain };
  }

  return result;
};

/**
 * Identifies if the provided ChainAddress is a supported currency contract in the
 * specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param contract - The ChainAddress of the contract to check
 * @returns a boolean indicating if the provided ChainAddress is a supported currency
 *          contract in the specified namespace
 */
export const isSupportedCurrencyContract = (
  namespaceId: ENSNamespaceId,
  contract: ChainAddress,
): boolean => {
  const supportedCurrencyContracts = getSupportedCurrencyContractsForNamespace(namespaceId);
  return Object.values(supportedCurrencyContracts).some((supportedCurrencyContract) =>
    isChainAddressEqual(supportedCurrencyContract, contract),
  );
};

/**
 * Gets the currency id for the given contract in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 * 'ens-test-env')
 * @param contract - The ChainAddress of the contract to get the currency id for
 * @returns the currency id for the given contract in the specified namespace, or
 *          null if the contract is not a supported currency contract in the
 *          specified namespace
 */
export const getCurrencyIdForContract = (
  namespaceId: ENSNamespaceId,
  contract: ChainAddress,
): CurrencyId | null => {
  const supportedCurrencyContracts = getSupportedCurrencyContractsForNamespace(namespaceId);

  for (const [currencyId, supportedCurrencyContract] of Object.entries(
    supportedCurrencyContracts,
  )) {
    if (isChainAddressEqual(supportedCurrencyContract, contract)) {
      return currencyId as CurrencyId;
    }
  }

  return null;
};

export interface OnchainEventRef {
  eventId: string;
  chainId: ChainId;
  blockNumber: number;
  logIndex: number;
  timestamp: UnixTimestamp;
  transactionHash: Hex;
}

export interface SupportedNFT {
  tokenType: TokenType;
  contract: ChainAddress;
  tokenId: TokenId;
  domainId: Node;
}

export interface SupportedPayment {
  price: Price;
}

export interface SupportedSale {
  /**
   * Event.id set as the unique and deterministic identifier of the onchain event
   * associated with the sale.
   *
   * Composite key format: "{chainId}-{blockNumber}-{logIndex}" (e.g., "1-1234567-5").
   *
   * @example "1-1234567-5"
   */
  event: OnchainEventRef;
  orderHash: Hex;
  nft: SupportedNFT;
  payment: SupportedPayment;
  seller: Address;
  buyer: Address;
}

/**
 * Indexes a supported sale transaction
 */
export const indexSupportedSale = async (context: Context, sale: SupportedSale): Promise<void> => {
  // Ensure buyer and seller accounts exist
  await upsertAccount(context, sale.seller);
  await upsertAccount(context, sale.buyer);

  const nameSoldRecord = {
    id: sale.event.eventId,
    chainId: sale.nft.contract.chainId,
    blockNumber: sale.event.blockNumber,
    logIndex: sale.event.logIndex,
    transactionHash: sale.event.transactionHash,
    orderHash: sale.orderHash,
    contractAddress: sale.nft.contract.address,
    tokenId: uint256ToHex32(sale.nft.tokenId),
    tokenType: sale.nft.tokenType,
    tokenRef: makeTokenRef(sale.nft.contract.chainId, sale.nft.contract.address, sale.nft.tokenId),
    domainId: sale.nft.domainId,
    buyer: sale.buyer,
    seller: sale.seller,
    currency: sale.payment.price.currency,
    amount: sale.payment.price.amount,
    timestamp: sale.event.timestamp,
  } satisfies typeof schema.nameSales.$inferInsert;

  // Index the sale
  await context.db.insert(schema.nameSales).values(nameSoldRecord);
};
