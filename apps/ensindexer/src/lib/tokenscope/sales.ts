import { AccountId, Node } from "@ensnode/ensnode-sdk";
import { Address, Hex } from "viem";

import { Price } from "@/lib/currencies";
import { AssetNamespace, TokenId } from "@/lib/tokenscope/assets";

export interface SupportedNFT {
  assetNamespace: AssetNamespace;
  contract: AccountId;
  tokenId: TokenId;
  domainId: Node;
}

export interface SupportedPayment {
  price: Price;
}

export interface SupportedSale {
  orderHash: Hex;
  nft: SupportedNFT;
  payment: SupportedPayment;
  seller: Address;
  buyer: Address;
}
