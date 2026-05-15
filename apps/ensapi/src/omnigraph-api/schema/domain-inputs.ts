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

/**
 * @oneOf filter for Domain names. Exactly one of `starts_with`, `eq`, or `in` must be provided.
 *
 * - `starts_with`: partial Interpreted Name for autocomplete; exact match on every label except
 *   the last, prefix match on the last label. ex: 'example', 'example.', 'example.et'.
 * - `eq`: exact InterpretedName match. Sugar for `in: [eq]`. Combine with `version` to disambiguate
 *   across ENS protocol versions.
 * - `in`: exact InterpretedName match against any name in the set. Max 100 items.
 */
export const DomainsNameFilter = builder.inputType("DomainsNameFilter", {
  description:
    "Filter Domains by name. Exactly one of `starts_with`, `eq`, or `in` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    starts_with: t.string({
      description:
        "Partial Interpreted Name for autocomplete. Matches Domains whose Interpreted Name starts with the given value: exact match on every label except the last, prefix match on the last label. ex: 'example', 'example.', 'example.et'. Case-sensitive (InterpretedName labels are normalized).",
    }),
    eq: t.field({
      type: "InterpretedName",
      description:
        "Exact InterpretedName match. Sugar for `in: [eq]`. Combine with `version` to disambiguate across ENS protocol versions.",
    }),
    in: t.field({
      type: ["InterpretedName"],
      description:
        "Exact InterpretedName match against any name in the set. Max 100 items; requests above the limit return an error.",
    }),
  }),
});

export const DomainsWhereInput = builder.inputType("DomainsWhereInput", {
  description: "Filter for the top-level domains query.",
  fields: (t) => ({
    name: t.field({
      type: DomainsNameFilter,
      required: true,
      description: "Filter the set of Domains by name.",
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
    name: t.field({
      type: DomainsNameFilter,
      description: "If set, filters the set of Domains by name.",
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
    name: t.field({
      type: DomainsNameFilter,
      description: "If set, filters the set of Domains in this Registry by name.",
    }),
  }),
});

export const SubdomainsWhereInput = builder.inputType("SubdomainsWhereInput", {
  description: "Filter for Domain.subdomains query.",
  fields: (t) => ({
    name: t.field({
      type: DomainsNameFilter,
      description: "If set, filters the set of subdomains by name.",
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
