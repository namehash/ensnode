import type { Hex, NormalizedName } from "../../types";

export interface PubkeyFixture {
  kind: "pubkey";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  x: Hex;
  y: Hex;
}
