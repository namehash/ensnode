import type { Hex, NormalizedName } from "../../types";

export interface ContenthashFixture {
  kind: "contenthash";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  value: string;
}
