import type { EventFilter } from "./types";

export const RootResolverFilter = [
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
] as const satisfies EventFilter[];

export const BaseResolverFilter = [
  { event: "AddrChanged", args: {} },
  { event: "AddressChanged", args: {} },
  { event: "NameChanged", args: {} },
  { event: "ABIChanged", args: {} },
  { event: "PubkeyChanged", args: {} },
  { event: "TextChanged", args: {} },
  { event: "ContenthashChanged", args: {} },
  { event: "InterfaceChanged", args: {} },
  { event: "VersionChanged", args: {} },
  { event: "DNSRecordChanged", args: {} },
  { event: "DNSRecordDeleted", args: {} },
  { event: "DNSZonehashChanged", args: {} },
] as const satisfies EventFilter[];

export const LineaResolverFilter = [
  { event: "AddrChanged", args: {} },
  { event: "AddressChanged", args: {} },
  { event: "NameChanged", args: {} },
  { event: "ABIChanged", args: {} },
  { event: "PubkeyChanged", args: {} },
  { event: "TextChanged", args: {} },
  { event: "ContenthashChanged", args: {} },
  { event: "InterfaceChanged", args: {} },
  { event: "VersionChanged", args: {} },
  { event: "DNSRecordChanged", args: {} },
  { event: "DNSRecordDeleted", args: {} },
  { event: "DNSZonehashChanged", args: {} },
] as const satisfies EventFilter[];
