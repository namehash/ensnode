import type { Address, Hex } from "viem";

import type { Price, SupportedNFT } from "@ensnode/ensnode-sdk";

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
