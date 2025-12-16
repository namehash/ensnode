import type { Address, Hex } from "viem";

import type { DomainAssetId, Price } from "@ensnode/ensnode-sdk";

export interface SupportedPayment {
  price: Price;
}

export interface SupportedSale {
  orderHash: Hex;
  nft: DomainAssetId;
  payment: SupportedPayment;
  seller: Address;
  buyer: Address;
}
