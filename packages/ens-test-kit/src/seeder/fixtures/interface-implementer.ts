import type { Hex, NormalizedName } from "../../types";

export interface InterfaceImplementerFixture {
  kind: "interface-implementer";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  interfaceId: Hex;
  implementer: Hex;
}
