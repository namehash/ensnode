import type { Hex, NormalizedName } from "../../types";

export interface AbiFixture {
  kind: "abi";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  contentType: number;
  value: string;
}
