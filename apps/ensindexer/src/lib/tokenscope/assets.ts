/**
 * An enum representing the possible CAIP-19 Asset Namespace values.
 */
export const AssetNamespaces = {
  ERC721: "erc721",
  ERC1155: "erc1155",
} as const;

export type AssetNamespace = (typeof AssetNamespaces)[keyof typeof AssetNamespaces];

/**
 * A uint256 value that identifies a specific token within an NFT contract.
 */
export type TokenId = bigint;
