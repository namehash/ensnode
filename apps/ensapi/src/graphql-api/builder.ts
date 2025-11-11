import SchemaBuilder from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import type { Address } from "viem";

import type {
  ChainId,
  DomainId,
  ImplicitRegistryId,
  InterpretedName,
  Node,
  RegistryId,
} from "@ensnode/ensnode-sdk";

export const builder = new SchemaBuilder<{
  Scalars: {
    BigInt: { Input: bigint; Output: bigint };
    Address: { Input: Address; Output: Address };
    ChainId: { Input: ChainId; Output: ChainId };
    Node: { Input: Node; Output: Node };
    Name: { Input: InterpretedName; Output: InterpretedName };
    DomainId: { Input: DomainId; Output: DomainId };
    RegistryId: { Input: RegistryId; Output: RegistryId };
    ImplicitRegistryId: { Input: ImplicitRegistryId; Output: ImplicitRegistryId };
    // PermissionsId: { Input: PermissionsId; Output: PermissionsId };
  };
}>({
  plugins: [DataloaderPlugin],
});
