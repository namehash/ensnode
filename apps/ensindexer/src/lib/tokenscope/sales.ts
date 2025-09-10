import { Address, Hex } from "viem";

import { Price } from "@/lib/currencies";
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
