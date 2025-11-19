import SchemaBuilder from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import type { Address, Hex } from "viem";

import type {
  ChainId,
  CoinType,
  DomainId,
  ImplicitRegistryId,
  InterpretedName,
  Node,
  RegistryId,
  ResolverId,
} from "@ensnode/ensnode-sdk";

export const builder = new SchemaBuilder<{
  Scalars: {
    BigInt: { Input: bigint; Output: bigint };
    Address: { Input: Address; Output: Address };
    Hex: { Input: Hex; Output: Hex };
    ChainId: { Input: ChainId; Output: ChainId };
    CoinType: { Input: CoinType; Output: CoinType };
    Node: { Input: Node; Output: Node };
    Name: { Input: InterpretedName; Output: InterpretedName };
    DomainId: { Input: DomainId; Output: DomainId };
    RegistryId: { Input: RegistryId; Output: RegistryId };
    ImplicitRegistryId: { Input: ImplicitRegistryId; Output: ImplicitRegistryId };
    ResolverId: { Input: ResolverId; Output: ResolverId };
    // PermissionsId: { Input: PermissionsId; Output: PermissionsId };
  };
}>({
  plugins: [DataloaderPlugin, RelayPlugin],
  relay: {
    // disable the Query.node & Query.nodes methods
    nodeQueryOptions: false,
    nodesQueryOptions: false,
  },
});
