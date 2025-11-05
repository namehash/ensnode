import type { Address, Hex } from "viem";

import type { Price } from "@ensnode/ensnode-sdk";

import type { SupportedNFT } from "@/lib/tokenscope/assets";

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
