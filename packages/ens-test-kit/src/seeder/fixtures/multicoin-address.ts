import type { ChainId, Hex, NormalizedName } from "../../types";

export interface MulticoinAddressFixture {
  kind: "multicoin-address";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  coinType: ChainId;
  value: string;
}
