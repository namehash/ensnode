import { builder } from "@/omnigraph-api/builder";
import { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";
import { OrderDirection } from "@/omnigraph-api/schema/order-direction";

//////////////////////
// Inputs
//////////////////////

export const DomainPermissionsWhereInput = builder.inputType("DomainPermissionsWhereInput", {
  description: "Filter Permissions over this Domain by a specific User address.",
  fields: (t) => ({
    user: t.field({ type: "Address" }),
  }),
});

export const DomainIdInput = builder.inputType("DomainIdInput", {
  description: "Reference a specific Domain.",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "InterpretedName" }),
    id: t.field({ type: "DomainId" }),
  }),
});

export const DomainsWhereInput = builder.inputType("DomainsWhereInput", {
  description: "Filter for the top-level domains query.",
  fields: (t) => ({
    name: t.string({
      required: true,
      description:
        "A partial Interpreted Name by which to search the set of Domains. ex: 'example', 'example.', 'example.et'.",
    }),
    version: t.field({
      type: ENSProtocolVersion,
      description:
        "If set, filters the set of Domains to only those of the specified ENS protocol version.",
    }),
  }),
});

export const AccountDomainsWhereInput = builder.inputType("AccountDomainsWhereInput", {
  description: "Filter for Account.domains query.",
  fields: (t) => ({
    name: t.string({
      description:
        "A partial Interpreted Name by which to search the set of Domains. ex: 'example', 'example.', 'example.et'.",
    }),
    canonical: t.boolean({
      description:
        "Optional, defaults to false. If true, filters the set of Domains by those that are Canonical (i.e. reachable by ENS Forward Resolution).",
      defaultValue: false,
    }),
    version: t.field({
      type: ENSProtocolVersion,
      description:
        "If set, filters the set of Domains to only those of the specified ENS protocol version.",
    }),
  }),
});

export const RegistryDomainsWhereInput = builder.inputType("RegistryDomainsWhereInput", {
  description: "Filter for Registry.domains query.",
  fields: (t) => ({
    name: t.string({
      description: "A partial Interpreted Name by which to filter Domains in this Registry.",
    }),
  }),
});

export const SubdomainsWhereInput = builder.inputType("SubdomainsWhereInput", {
  description: "Filter for Domain.subdomains query.",
  fields: (t) => ({
    name: t.string({
      description: "A partial Interpreted Name by which to filter subdomains.",
    }),
  }),
});

//////////////////////
// Ordering
//////////////////////

export const DomainsOrderBy = builder.enumType("DomainsOrderBy", {
  description: "Fields by which domains can be ordered",
  values: ["NAME", "REGISTRATION_TIMESTAMP", "REGISTRATION_EXPIRY"] as const,
});

export type DomainsOrderByValue = typeof DomainsOrderBy.$inferType;

export const DomainsOrderInput = builder.inputType("DomainsOrderInput", {
  description: "Ordering options for domains query. If no order is provided, the default is ASC.",
  fields: (t) => ({
    by: t.field({ type: DomainsOrderBy, required: true }),
    dir: t.field({ type: OrderDirection, defaultValue: "ASC" }),
  }),
});

export const DOMAINS_DEFAULT_ORDER_BY: typeof DomainsOrderBy.$inferType = "NAME";
export const DOMAINS_DEFAULT_ORDER_DIR: typeof OrderDirection.$inferType = "ASC";
