import { builder } from "@/omnigraph-api/builder";
import { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";
import { OrderDirection, type OrderDirectionValue } from "@/omnigraph-api/schema/order-direction";

//////////////////////
// Inputs
//////////////////////

/**
 * Max number of addresses accepted by `DomainPermissionsUserFilter.in`.
 */
export const DOMAIN_PERMISSIONS_USER_FILTER_IN_MAX = 10;

/**
 * @oneOf filter for Permissions users. Exactly one of `eq` or `in` must be provided.
 */
export const DomainPermissionsUserFilter = builder.inputType("DomainPermissionsUserFilter", {
  description: "Filter Permissions by user address. Exactly one of `eq` or `in` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    eq: t.field({
      type: "Address",
      description: "Exact user address match.",
    }),
    in: t.field({
      type: ["Address"],
      description: `User address matches any value in the set. Max ${DOMAIN_PERMISSIONS_USER_FILTER_IN_MAX} items. An empty set matches nothing.`,
      validate: { maxLength: DOMAIN_PERMISSIONS_USER_FILTER_IN_MAX },
    }),
  }),
});

export const DomainPermissionsWhereInput = builder.inputType("DomainPermissionsWhereInput", {
  description: "Filter Permissions over this Domain by user.",
  fields: (t) => ({
    user: t.field({
      type: DomainPermissionsUserFilter,
      description: "Filter Permissions to those whose user matches the provided filter.",
    }),
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
 * Max number of names accepted by `DomainsNameFilter.in`.
 */
export const DOMAINS_NAME_FILTER_IN_MAX = 100;

/**
 * @oneOf filter for Domain names. Exactly one of `starts_with`, `eq`, or `in` must be provided.
 *
 * - `starts_with`: prefix-match on Interpreted Name for typeahead. Case-insensitive.
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
        "Prefix-match on Interpreted Name for typeahead. ex: 'vit', 'vitalik.et'. Case-insensitive (InterpretedName labels are normalized).",
      validate: { minLength: 1 },
    }),
    eq: t.field({
      type: "InterpretedName",
      description:
        "Exact InterpretedName match. Sugar for `in: [eq]`. Combine with `version` to disambiguate across ENS protocol versions.",
      validate: { minLength: 1 },
    }),
    in: t.field({
      type: ["InterpretedName"],
      description: `Exact InterpretedName match against any name in the set. Max ${DOMAINS_NAME_FILTER_IN_MAX} items.`,
      validate: { items: { minLength: 1 }, maxLength: DOMAINS_NAME_FILTER_IN_MAX },
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
        "If set, filters the set of Domains by canonicality (i.e. reachability by ENS Forward Resolution): `true` for Canonical only, `false` for non-Canonical only. If omitted, returns all Domains owned by the Account regardless of canonicality.",
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
  values: ["NAME", "DEPTH", "REGISTRATION_TIMESTAMP", "REGISTRATION_EXPIRY"] as const,
});

export type DomainsOrderByValue = typeof DomainsOrderBy.$inferType;

export const DomainsOrderInput = builder.inputType("DomainsOrderInput", {
  description: "Ordering options for domains query. If no order is provided, the default is ASC.",
  fields: (t) => ({
    by: t.field({ type: DomainsOrderBy, required: true }),
    dir: t.field({ type: OrderDirection, defaultValue: "ASC" }),
  }),
});

export type DomainsOrderValue = { by: DomainsOrderByValue; dir: OrderDirectionValue };
