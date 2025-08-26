import { EventWithArgs } from "@/lib/ponder-helpers";
import { Address, Hex } from "viem";

/**
 * Seaport's ItemType enum, re-implemented here to avoid a dependency on seaport-js.
 *
 * NOTE: if we require further types functionality from seaport-js, we should simply depend on it
 * and import them directly.
 *
 * @see https://github.com/ProjectOpenSea/seaport-js/blob/c4d4756c8000a7143fc1ed9a5aad71b444ae90b4/src/constants.ts#L89
 */
export enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

/**
 * A Seaport OrderFulfilled Event from Ponder, semantically typed with descriptions.
 */
export type OrderFulfilledEvent = EventWithArgs<{
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
  offer: readonly OfferItem[];

  /**
   * Array of items that the offerer expects to receive in return.
   * For listings: ETH/ERC20 tokens expected as payment
   * For offers: NFTs/tokens being requested in exchange
   */
  consideration: readonly ConsiderationItem[];
}>;

export type OfferItem = {
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

export type ConsiderationItem = {
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
