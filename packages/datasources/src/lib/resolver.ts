import { mergeAbis } from "@ponder/utils";
import { LegacyPublicResolver } from "../abis/resolver/LegacyPublicResolver";
import { Resolver } from "../abis/resolver/Resolver";
import type { ContractConfig } from "./types";

export const ResolverABI = mergeAbis([LegacyPublicResolver, Resolver]);

/**
 * The Resolver ABI is the same across plugins, and includes the LegacyPublicResolver abi
 * (notably its altered `TextChanged` event) for full compatibility with Resolvers on mainnet.
 *
 * Individual plugins will specify their preferred `startBlock`s for Resolvers, so `startBlock`
 * is omitted in this ContractConfig.
 */
export const ResolverConfig = {
  abi: ResolverABI,
  // NOTE: a Resolver is any contract that matches this `filter`
  filter: [
    { event: "AddrChanged", args: {} },
    { event: "AddressChanged", args: {} },
    { event: "NameChanged", args: {} },
    { event: "ABIChanged", args: {} },
    { event: "PubkeyChanged", args: {} },
    {
      event: "TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
      args: {},
    },
    {
      event:
        "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
      args: {},
    },
    { event: "ContenthashChanged", args: {} },
    { event: "InterfaceChanged", args: {} },
    { event: "AuthorisationChanged", args: {} },
    { event: "VersionChanged", args: {} },
    { event: "DNSRecordChanged", args: {} },
    { event: "DNSRecordDeleted", args: {} },
    { event: "DNSZonehashChanged", args: {} },
  ],
} as const satisfies Omit<ContractConfig, "startBlock">;
