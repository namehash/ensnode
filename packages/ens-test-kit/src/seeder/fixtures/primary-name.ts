import type { ChainId, Hex, NormalizedName } from "../../types";

export interface PrimaryNameFixture {
  kind: "primary-name";
  id: string;
  address: Hex;
  chainId: ChainId;
  name: NormalizedName;
}
