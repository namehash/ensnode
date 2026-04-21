import type { InterpretedName } from "enssdk";

import type {
  SerializedNameTokensResponseError,
  SerializedNameTokensResponseOk,
} from "./serialized-response";

/**
 * Example value for {@link SerializedNameTokensResponseOk}, for use in OpenAPI documentation.
 *
 * - domainId and tokenId correspond to "vitalik.eth"
 * - contract is the ENS BaseRegistrar (ERC-721) on Ethereum mainnet
 */
export const nameTokensResponseOkExample = {
  responseCode: "ok",
  registeredNameTokens: {
    domainId: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
    name: "vitalik.eth" as InterpretedName,
    tokens: [
      {
        token: {
          assetNamespace: "erc721",
          contract: {
            chainId: 1,
            address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
          },
          tokenId: "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        },
        ownership: {
          ownershipType: "fully-onchain",
          owner: {
            chainId: 1,
            address: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
          },
        },
        mintStatus: "minted",
      },
    ],
    expiresAt: 2461152330,
    accurateAsOf: 1700000000,
  },
} satisfies SerializedNameTokensResponseOk;

/**
 * Example value for {@link SerializedNameTokensResponseError} representing a 503 Service Unavailable
 * when the Name Tokens API prerequisites are not met, for use in OpenAPI documentation.
 */
export const nameTokensServiceUnavailableExample = {
  responseCode: "error",
  errorCode: "unsupported-ensindexer-config",
  error: {
    message: "Name Tokens API is not available",
    details: "Connected ENSIndexer must have all following plugins active: registrars, tokenscope",
  },
} satisfies SerializedNameTokensResponseError;

/**
 * Example value for {@link NameTokensResponseErrorNameTokensNotIndexed} representing a 404 Not Found
 * when no name tokens are indexed for the requested name or domainId, for use in OpenAPI documentation.
 */
export const nameTokensNotIndexedExample = {
  responseCode: "error",
  errorCode: "name-tokens-not-indexed",
  error: {
    message: "No indexed Name Tokens found",
    details:
      "This ENSNode instance has not been configured to index tokens for the requested name: 'vitalik.eth'",
  },
} satisfies SerializedNameTokensResponseError;
