import { Price } from "@ensnode/ensnode-sdk";
import { Address, Hex } from "viem";

import { SupportedNFT } from "@/lib/tokenscope/assets";

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
