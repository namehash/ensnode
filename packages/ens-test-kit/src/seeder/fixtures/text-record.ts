import type { Hex, NormalizedName } from "../../types";

export interface TextRecordFixture {
  kind: "text-record";
  id: string;
  name: NormalizedName;
  resolverAddress?: Hex;
  key: string;
  value: string;
}
