import { Price } from "@/lib/currencies";
import { TokenId, TokenType } from "@/lib/tokenscope/tokens";
import { ChainAddress, ChainId } from "@ensnode/datasources";
import { Node, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { Address, Hex } from "viem";

export interface OnchainEventRef {
  /**
   * Event.id set as the unique and deterministic identifier of the onchain event
   * associated with the sale.
   *
   * Composite key format: "{chainId}-{blockNumber}-{logIndex}" (e.g., "1-1234567-5").
   *
   * @example "1-1234567-5"
   */
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
  event: OnchainEventRef;
  orderHash: Hex;
  nft: SupportedNFT;
  payment: SupportedPayment;
  seller: Address;
  buyer: Address;
}
