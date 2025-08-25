import { ChainId } from "@ensnode/datasources";
import { uint256ToHex32 } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

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
