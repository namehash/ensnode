import SchemaBuilder from "@pothos/core";
import type { Address } from "viem";

import type { ChainId, DomainId, InterpretedName, Node } from "@ensnode/ensnode-sdk";

export const builder = new SchemaBuilder<{
  Scalars: {
    BigInt: { Input: bigint; Output: bigint };
    Address: { Input: Address; Output: Address };
    ChainId: { Input: ChainId; Output: ChainId };
    Node: { Input: Node; Output: Node };
    Name: { Input: InterpretedName; Output: InterpretedName };
    DomainId: { Input: DomainId; Output: DomainId };
  };
}>({});
