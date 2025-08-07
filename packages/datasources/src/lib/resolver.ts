import { mergeAbis } from "@ponder/utils";
import { LegacyPublicResolver } from "../abis/shared/LegacyPublicResolver";
import { Resolver } from "../abis/shared/Resolver";
import type { ContractConfig } from "./types";

/**
 * The Resolver ABI is the same across plugins, and includes the LegacyPublicResolver abi
 * (notably its altered `TextChanged` event) for full compatibility with Resolvers on mainnet.
 */
export const ResolverABI = mergeAbis([LegacyPublicResolver, Resolver]);

/**
 * This is the ContractConfig['filter'] describing the set of events that Resolver contracts emit.
 * It is not technically necessary for Ponder to function, but we explicitly document it here.
 */
export const ResolverFilter = [
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
    event: "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    args: {},
  },
  { event: "ContenthashChanged", args: {} },
  { event: "InterfaceChanged", args: {} },
  { event: "AuthorisationChanged", args: {} },
  { event: "VersionChanged", args: {} },
  { event: "DNSRecordChanged", args: {} },
  { event: "DNSRecordDeleted", args: {} },
  { event: "DNSZonehashChanged", args: {} },
] as const satisfies ContractConfig["filter"];
