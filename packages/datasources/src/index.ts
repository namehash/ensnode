import {makeSubdomainNode, ETH_NODE, ChainId} from "@ensnode/ensnode-sdk";
import {Address, Hex} from "viem";
import {
    base,
    baseSepolia,
    holesky as holeskyChain,
    linea,
    lineaSepolia,
    mainnet as mainnetChain,
    optimism,
    sepolia as sepoliaChain,
} from "viem/chains";
import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import {DatasourceNames, ENSNamespace, ENSNamespaceId, ENSNamespaceIds} from "./lib/types";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";
// export the shared ResolverABI for consumer convenience
export {ResolverABI} from "./lib/resolver";

/**
 * Identifies a specific address on a specific chain.
 */
export interface ChainAddress {
    chainId: ChainId;
    address: Address;
}

export interface Currency {
    symbol: string;
    name: string;
    decimals: number;
    // For native currencies, address will be null
    address: Address | null;
}

export interface ChainCurrency extends Currency {
    chainId: ChainId;
}

// Add this constant after your existing constants
const NATIVE_CURRENCY_SYMBOL = "NATIVE" as const;

// internal map ENSNamespaceId -> ENSNamespace
const ENSNamespacesById = {
    mainnet,
    sepolia,
    holesky,
    "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSNamespaceId, ENSNamespace>;

/**
 * Returns the ENSNamespace for a specified `namespaceId`.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns the ENSNamespace
 */
export const getENSNamespace = <N extends ENSNamespaceId>(
    namespaceId: N,
): (typeof ENSNamespacesById)[N] => ENSNamespacesById[namespaceId];

/**
 * Returns the `datasourceName` Datasource within the specified `namespaceId` namespace.
 *
 * NOTE: the typescript typechecker _will_ enforce validity. i.e. using an invalid `datasourceName`
 * within the specified `namespaceId` will be a type error.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace
 */
export const getDatasource = <
    N extends ENSNamespaceId,
    D extends keyof ReturnType<typeof getENSNamespace<N>>,
>(
    namespaceId: N,
    datasourceName: D,
) => getENSNamespace(namespaceId)[datasourceName];

/**
 * Returns the chain for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain that hosts the ENS Root
 */
export const getENSRootChain = (namespaceId: ENSNamespaceId) =>
    getDatasource(namespaceId, DatasourceNames.ENSRoot).chain;

/**
 * Returns the chain id for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain ID that hosts the ENS Root
 */
export const getENSRootChainId = (namespaceId: ENSNamespaceId) => getENSRootChain(namespaceId).id;

/**
 * Returns the Address of the NameWrapper contract within the requested namespace.
 *
 * @returns the viem#Address object
 */
export const getNameWrapperAddress = (namespaceId: ENSNamespaceId): Address =>
    getDatasource(namespaceId, DatasourceNames.ENSRoot).contracts.NameWrapper.address;

/**
 * Get the ENS Manager App URL for the provided namespace.
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns ENS Manager App URL for the provided namespace, or null if the provided namespace doesn't have a known ENS Manager App
 */
export function getEnsManagerAppUrl(namespaceId: ENSNamespaceId): URL | null {
    switch (namespaceId) {
        case ENSNamespaceIds.Mainnet:
            return new URL(`https://app.ens.domains/`);
        case ENSNamespaceIds.Sepolia:
            return new URL(`https://sepolia.app.ens.domains/`);
        case ENSNamespaceIds.Holesky:
            return new URL(`https://holesky.app.ens.domains/`);
        case ENSNamespaceIds.EnsTestEnv:
            // ens-test-env runs on a local chain and is not supported by app.ens.domains
            return null;
    }
}

/**
 * Get the avatar image URL for a name on the given ENS Namespace
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @param {string} name - ENS name to get the avatar image URL for
 * @returns avatar image URL for the name on the given ENS Namespace, or null if the avatar image URL is not known
 */
export function getNameAvatarUrl(name: string, namespaceId: ENSNamespaceId): URL | null {
    switch (namespaceId) {
        case ENSNamespaceIds.Mainnet:
            return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
        case ENSNamespaceIds.Sepolia:
            return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
        case ENSNamespaceIds.Holesky:
            // metadata.ens.domains doesn't currently support holesky
            return null;
        case ENSNamespaceIds.EnsTestEnv:
            // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
            return null;
    }
}

/**
 * Get the URL of the name details page in ENS Manager App for a given name and ENS Namespace.
 *
 * @returns URL to the name details page in the ENS Manager App for a given name and ENS Namespace, or null if this URL is not known
 */
export function getNameDetailsUrl(name: string, namespaceId: ENSNamespaceId): URL | null {
    const baseUrl = getEnsManagerAppUrl(namespaceId);

    return baseUrl ? new URL(name, baseUrl) : null;
}

/**
 * Get the URL of the address details page in ENS Manager App for a given address and ENS Namespace.
 *
 * @returns URL to the address details page in the ENS Manager App for a given address and ENS Namespace, or null if this URL is not known
 */
export function getAddressDetailsUrl(address: Address, namespaceId: ENSNamespaceId): URL | null {
    const baseUrl = getEnsManagerAppUrl(namespaceId);

    return baseUrl ? new URL(address, baseUrl) : null;
}

/**
 * Mapping of chain id to chain's default block explorer URL.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainBlockExplorers = new Map<number, string>([
    [mainnetChain.id, "https://etherscan.io"],
    [base.id, "https://basescan.org"],
    [sepoliaChain.id, "https://sepolia.etherscan.io"],
    [optimism.id, "https://optimistic.etherscan.io"],
    [linea.id, "https://lineascan.build"],
    [holeskyChain.id, "https://holesky.etherscan.io"],
    [baseSepolia.id, "https://sepolia.basescan.org"],
    [lineaSepolia.id, "https://sepolia.lineascan.build"],
]);

/**
 * Gets the base block explorer URL for a given chainId
 *
 * @returns default block explorer URL for the chain with the provided id,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getChainBlockExplorerUrl = (chainId: number): URL | null => {
    const chainBlockExplorer = chainBlockExplorers.get(chainId);

    if (!chainBlockExplorer) {
        return null;
    }

    return new URL(chainBlockExplorer);
};

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 *
 * @returns complete block explorer URL for a specific block on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerUrlForBlock = (chainId: number, blockNumber: number): URL | null => {
    const chainBlockExplorer = getChainBlockExplorerUrl(chainId);

    if (!chainBlockExplorer) {
        return null;
    }
    return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
};

/**
 * Mapping of chain id to prettified chain name.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainNames = new Map<number, string>([
    [mainnetChain.id, "Ethereum"],
    [base.id, "Base"],
    [sepoliaChain.id, "Ethereum Sepolia"],
    [optimism.id, "Optimism"],
    [linea.id, "Linea"],
    [holeskyChain.id, "Ethereum Holesky"],
    [1337, "Ethereum Local"], // ens-test-env runs on a local Anvil chain with id 1337
    [baseSepolia.id, "Base Sepolia"],
    [lineaSepolia.id, "Linea Sepolia"],
]);

/**
 * Returns a prettified chain name for the provided chain ID,
 * or throws an error if the provided chain id doesn't have an assigned name.
 */
export function getChainName(chainId: number): string {
    const chainName = chainNames.get(chainId);

    if (!chainName) {
        throw new Error(`Chain ID "${chainId}" doesn't have an assigned name`);
    }

    return chainName;
}

/**
 * Returns an array of 0 or more ChainAddress objects that are known to provide tokenized name ownership.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more ChainAddress objects
 */
export const getKnownTokenIssuingContracts = (namespaceId: ENSNamespaceId): ChainAddress[] => {
    switch (namespaceId) {
        case ENSNamespaceIds.Mainnet: {
            const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
            const lineanamesDatasource = getDatasource(namespaceId, DatasourceNames.Lineanames);
            const basenamesDatasource = getDatasource(namespaceId, DatasourceNames.Basenames);
            const threeDnsBaseDatasource = getDatasource(namespaceId, DatasourceNames.ThreeDNSBase);
            const threeDnsOptimismDatasource = getDatasource(
                namespaceId,
                DatasourceNames.ThreeDNSOptimism,
            );
            return [
                // Eth Token - Mainnet
                {
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["BaseRegistrar"].address,
                },
                // NameWrapper Token - Mainnet
                {
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["NameWrapper"].address,
                },
                // 3DNS Token - Optimism
                {
                    chainId: threeDnsOptimismDatasource.chain.id,
                    address: threeDnsOptimismDatasource.contracts["ThreeDNSToken"].address,
                },
                // 3DNS Token - Base
                {
                    chainId: threeDnsBaseDatasource.chain.id,
                    address: threeDnsBaseDatasource.contracts["ThreeDNSToken"].address,
                },
                // Linea Names Token - Linea
                {
                    chainId: lineanamesDatasource.chain.id,
                    address: lineanamesDatasource.contracts["BaseRegistrar"].address,
                },
                // Base Names Token - Base
                {
                    chainId: basenamesDatasource.chain.id,
                    address: basenamesDatasource.contracts["BaseRegistrar"].address,
                },
            ];
        }
        case ENSNamespaceIds.Sepolia: {
            const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
            const basenamesDatasource = getDatasource(namespaceId, DatasourceNames.Basenames);
            const lineanamesDatasource = getDatasource(namespaceId, DatasourceNames.Lineanames);

            return [
                {
                    // ENS Token - Sepolia
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["BaseRegistrar"].address,
                },
                {
                    // NameWrapper Token - Sepolia
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["NameWrapper"].address,
                },
                {
                    // Basenames Token - Base Sepolia
                    chainId: basenamesDatasource.chain.id,
                    address: basenamesDatasource.contracts["BaseRegistrar"].address,
                },
                {
                    // Lineanames Token - Linea Sepolia
                    chainId: lineanamesDatasource.chain.id,
                    address: lineanamesDatasource.contracts["BaseRegistrar"].address,
                },
            ];
        }
        case ENSNamespaceIds.Holesky: {
            const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
            return [
                {
                    // ENS Token - Holesky
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["BaseRegistrar"].address,
                },
                {
                    // NameWrapper Token - Holesky
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["NameWrapper"].address,
                },
            ];
        }
        case ENSNamespaceIds.EnsTestEnv: {
            const rootDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
            return [
                {
                    // ENS Token - EnsTestEnv
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["BaseRegistrar"].address,
                },
                {
                    // NameWrapper Token - EnsTestEnv
                    chainId: rootDatasource.chain.id,
                    address: rootDatasource.contracts["NameWrapper"].address,
                },
            ];
        }
    }
};

/**
 * Returns a boolean indicating whether the provided ChainAddress is a known token issuing contract.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param chainAddress - The ChainAddress to check
 * @returns a boolean indicating whether the provided ChainAddress is a known token issuing contract
 */
export const isKnownTokenIssuingContract = (
    namespaceId: ENSNamespaceId,
    chainAddress: ChainAddress,
): boolean => {
    const knownContracts = getKnownTokenIssuingContracts(namespaceId);
    return knownContracts.some((contract) => isEqualChainAddress(contract, chainAddress));
};

/**
 * Returns a boolean indicating whether the provided ChainAddress objects are equal.
 *
 * @param address1 - The first ChainAddress to compare
 * @param address2 - The second ChainAddress to compare
 * @returns a boolean indicating whether the provided ChainAddress objects are equal
 */
export const isEqualChainAddress = (address1: ChainAddress, address2: ChainAddress): boolean => {
    return (
        address1.chainId === address2.chainId &&
        address1.address.toLowerCase() === address2.address.toLowerCase()
    );
};

/**
 * Get the domainId by contract address and tokenId
 * @param chainId - The chainId of the NFT
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param contractAddress - contract address of the NFT
 * @param tokenIdHex - tokenId of the NFT in hex
 */
export function getDomainIdByTokenId(
    chainId: ChainId,
    namespaceId: ENSNamespaceId,
    contractAddress: Address,
    tokenIdHex: Hex,
): Hex {
    const baseRegistrarContractAddress = getDatasource(namespaceId, DatasourceNames.ENSRoot)
        .contracts["BaseRegistrar"].address;

    // OLD ENS Registry: tokenId is labelhash so need to convert to namehash
    if (contractAddress === baseRegistrarContractAddress) {
        return makeSubdomainNode(tokenIdHex, ETH_NODE);
    }

    // for other names we for now assume it is already namehash
    return tokenIdHex;
}

// Well-known currencies
const ETH_CURRENCY = {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    address: null,
} as const;

const CHAIN_CURRENCIES = {
    // Mainnet
    [mainnetChain.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0xA0b86a33E6417c5Dd4Baf8C54e5de49E293E9169" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as Address,
        },
    ],
    // Base
    [base.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as Address,
        },
    ],
    // Optimism
    [optimism.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as Address,
        },
    ],
    // Linea
    [linea.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5" as Address,
        },
    ],
    // Sepolia
    [sepoliaChain.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" as Address,
        },
    ],
    // Holesky
    [holeskyChain.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" as Address,
        },
    ],
    // Base Sepolia
    [baseSepolia.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x7368C6C68a4b2b68F90DB2e8F5E3b8E1E5e4F5c7" as Address,
        },
    ],
    // Linea Sepolia
    [lineaSepolia.id]: [
        {
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" as Address,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
            address: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5" as Address,
        },
    ],
} as const;

/**
 * Returns an array of supported currencies for a given chain ID.
 *
 * @param chainId - The chain ID to get supported currencies for
 * @returns an array of ChainCurrency objects representing supported currencies on the chain
 */
export const getSupportedCurrencies = (chainId: ChainId): ChainCurrency[] => {
    const chainCurrencies = CHAIN_CURRENCIES[chainId as keyof typeof CHAIN_CURRENCIES] || [];

    // Always add ETH as the native currency
    const currencies: ChainCurrency[] = [
        {
            ...ETH_CURRENCY,
            chainId,
        }
    ];

    // Add chain-specific currencies
    currencies.push(...chainCurrencies.map(currency => ({
        ...currency,
        chainId,
    })));

    return currencies;
};

/**
 * Returns a boolean indicating whether the provided address is a known supported currency contract.
 *
 * @param chainId - The chain ID
 * @param address - The contract address to check
 * @returns a boolean indicating whether the address is a known supported currency contract
 */
export const isKnownCurrencyContract = (chainId: ChainId, address: Address): boolean => {
    const supportedCurrencies = getSupportedCurrencies(chainId);
    return supportedCurrencies.some(currency =>
        currency.address && currency.address.toLowerCase() === address.toLowerCase()
    );
};