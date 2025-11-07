import SchemaBuilder from "@pothos/core";
import type { Address } from "viem";

import type { ChainId, Name, Node } from "@ensnode/ensnode-sdk";

export const builder = new SchemaBuilder<{
  Scalars: {
    BigInt: { Input: bigint; Output: bigint };
    Address: { Input: Address; Output: Address };
    ChainId: { Input: ChainId; Output: ChainId };
    Node: { Input: Node; Output: Node };
    Name: { Input: Name; Output: Name };
  };
}>({});
