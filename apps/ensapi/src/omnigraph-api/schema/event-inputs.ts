import { builder } from "@/omnigraph-api/builder";

//////////
// Inputs
//////////

/**
 * Max number of selectors accepted by `EventsSelectorFilter.in`.
 */
export const EVENTS_SELECTOR_FILTER_IN_MAX = 10;

/**
 * Max number of addresses accepted by `EventsFromFilter.in`.
 */
export const EVENTS_FROM_FILTER_IN_MAX = 10;

/**
 * Max number of addresses accepted by `EventsSenderFilter.in`.
 */
export const EVENTS_SENDER_FILTER_IN_MAX = 10;

/**
 * @oneOf filter for Event selectors. Exactly one of `eq` or `in` must be provided.
 */
export const EventsSelectorFilter = builder.inputType("EventsSelectorFilter", {
  description:
    "Filter Events by selector (event signature). Exactly one of `eq` or `in` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    eq: t.field({
      type: "Hex",
      description: "Exact selector match.",
    }),
    in: t.field({
      type: ["Hex"],
      description: `Selector matches any value in the set. Max ${EVENTS_SELECTOR_FILTER_IN_MAX} items. An empty set matches nothing.`,
      validate: { maxLength: EVENTS_SELECTOR_FILTER_IN_MAX },
    }),
  }),
});

/**
 * @oneOf filter for Event `tx.from`. Exactly one of `eq` or `in` must be provided.
 */
export const EventsFromFilter = builder.inputType("EventsFromFilter", {
  description:
    "Filter Events by `tx.from`. Not HCA-aware — use `sender` to filter by the HCA-aware actor. Exactly one of `eq` or `in` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    eq: t.field({
      type: "Address",
      description: "Exact `tx.from` match.",
    }),
    in: t.field({
      type: ["Address"],
      description: `\`tx.from\` matches any address in the set. Max ${EVENTS_FROM_FILTER_IN_MAX} items. An empty set matches nothing.`,
      validate: { maxLength: EVENTS_FROM_FILTER_IN_MAX },
    }),
  }),
});

/**
 * @oneOf filter for Event HCA-aware `sender`. Exactly one of `eq` or `in` must be provided.
 */
export const EventsSenderFilter = builder.inputType("EventsSenderFilter", {
  description:
    "Filter Events by HCA-aware `sender` (the HCA account address if used, otherwise Transaction.from). Exactly one of `eq` or `in` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    eq: t.field({
      type: "Address",
      description: "Exact `sender` match.",
    }),
    in: t.field({
      type: ["Address"],
      description: `\`sender\` matches any address in the set. Max ${EVENTS_SENDER_FILTER_IN_MAX} items. An empty set matches nothing.`,
      validate: { maxLength: EVENTS_SENDER_FILTER_IN_MAX },
    }),
  }),
});

/**
 * Range filter for Event timestamps. At least one bound must be provided. Bounds may combine
 * (e.g. `{ gte, lte }` for a closed range), but `gt`/`gte` are mutually exclusive, as are
 * `lt`/`lte`. If both a lower and upper bound are provided, the lower must be less than the upper.
 */
export const EventsTimestampFilter = builder.inputType("EventsTimestampFilter", {
  description:
    "Filter Events by timestamp range. At least one bound must be provided. `gt`/`gte` are mutually exclusive; `lt`/`lte` are mutually exclusive.",
  fields: (t) => ({
    gt: t.field({
      type: "BigInt",
      description: "Filter to events strictly after this UnixTimestamp.",
    }),
    gte: t.field({
      type: "BigInt",
      description: "Filter to events at or after this UnixTimestamp.",
    }),
    lt: t.field({
      type: "BigInt",
      description: "Filter to events strictly before this UnixTimestamp.",
    }),
    lte: t.field({
      type: "BigInt",
      description: "Filter to events at or before this UnixTimestamp.",
    }),
  }),
  validate: {
    refine: [
      [
        (data) => [data.gt, data.gte, data.lt, data.lte].some((v) => v != null),
        { message: "At least one bound (gt, gte, lt, lte) must be provided." },
      ],
      [
        (data) => !(data.gt != null && data.gte != null),
        { message: "`gt` and `gte` are mutually exclusive." },
      ],
      [
        (data) => !(data.lt != null && data.lte != null),
        { message: "`lt` and `lte` are mutually exclusive." },
      ],
      [
        (data) => {
          const lower = data.gt ?? data.gte;
          const upper = data.lt ?? data.lte;
          if (lower == null || upper == null) return true;
          return lower <= upper;
        },
        { message: "Lower bound must be less than or equal to upper bound." },
      ],
    ],
  },
});

/**
 * Shared filter for events connections. Used by Domain.events, Resolver.events, Permissions.events,
 * and Account.events (which excludes `sender` since it's implied).
 */
export const EventsWhereInput = builder.inputType("EventsWhereInput", {
  description: "Filter conditions for an events connection.",
  fields: (t) => ({
    selector: t.field({
      type: EventsSelectorFilter,
      description: "Filter to events whose selector (event signature) matches the provided filter.",
    }),
    timestamp: t.field({
      type: EventsTimestampFilter,
      description: "Filter to events whose UnixTimestamp falls within the provided range.",
    }),
    from: t.field({
      type: EventsFromFilter,
      description:
        "Filter to events whose `tx.from` matches the provided filter. Not HCA-aware — use `sender` to filter by the HCA-aware actor.",
    }),
    sender: t.field({
      type: EventsSenderFilter,
      description:
        "Filter to events whose HCA-aware `sender` matches the provided filter (the HCA account address if used, otherwise Transaction.from).",
    }),
  }),
});

/**
 * Like EventsWhereInput but without `sender` (used where `sender` is implied, e.g. Account.events).
 */
export const AccountEventsWhereInput = builder.inputType("AccountEventsWhereInput", {
  description: "Filter conditions for Account.events (where `sender` is implied by the Account).",
  fields: (t) => ({
    selector: t.field({
      type: EventsSelectorFilter,
      description: "Filter to events whose selector (event signature) matches the provided filter.",
    }),
    timestamp: t.field({
      type: EventsTimestampFilter,
      description: "Filter to events whose UnixTimestamp falls within the provided range.",
    }),
    from: t.field({
      type: EventsFromFilter,
      description:
        "Filter to events whose `tx.from` matches the provided filter. Not HCA-aware — the Account's HCA-aware filter is applied via `sender = Account.id`.",
    }),
  }),
});
