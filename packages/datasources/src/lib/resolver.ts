import { mergeAbis } from "@ponder/utils";
import { LegacyPublicResolver } from "../abis/shared/LegacyPublicResolver";
import { Resolver } from "../abis/shared/Resolver";
import type { ContractConfig } from "./types";

/**
 * This Resolver ABI represents the set of all well-known Resolver events/methods, including the
 * the LegacyPublicResolver's TextChanged event. A Resolver contract is a contract that emits
 * _any_ (not _all_) of the events specified here and may or may not support any number of the
 * methods available in this ABI.
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
