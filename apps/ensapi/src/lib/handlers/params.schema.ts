import { z } from "@hono/zod-openapi";
import { DEFAULT_EVM_CHAIN_ID, isNormalizedName, type Name } from "enssdk";

import { isSelectionEmpty, type ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import {
  makeCoinTypeStringSchema,
  makeDefaultableChainIdStringSchema,
  makeNormalizedAddressSchema,
} from "@ensnode/ensnode-sdk/internal";

const excludingDefaultChainId = z
  .number()
  .refine(
    (val) => val !== DEFAULT_EVM_CHAIN_ID,
    `Must not be the 'default' EVM chain id (${DEFAULT_EVM_CHAIN_ID}).`,
  );

const boolstring = z
  .string()
  .pipe(z.enum(["true", "false"]))
  .transform((val) => val === "true")
  .openapi({ type: "boolean" });

const stringarray = z
  .string()
  .transform((val) => val.split(","))
  .pipe(z.array(z.string().min(1)).min(1))
  .refine((values) => new Set(values).size === values.length, {
    message: "Must be a set of unique entries.",
  });

const name = z
  .string()
  .refine(isNormalizedName, "Must be normalized, see https://docs.ens.domains/resolution/names/")
  .transform((val) => val as Name)
  .describe("ENS name to resolve (e.g. 'vitalik.eth'). Must be normalized per ENSIP-15.");

const trace = z
  .optional(boolstring)
  .default(false)
  .describe(
    "Include detailed OpenTelemetry trace information about the resolution in the response.",
  )
  .openapi({ default: false });

const accelerate = z
  .optional(boolstring)
  .default(false)
  .describe("Attempt Protocol Acceleration using indexed data.")
  .openapi({
    default: false,
  });
const address = makeNormalizedAddressSchema().describe(
  "EVM wallet address (e.g. '0xd8da6bf26964af9d7eed9e03e53415d37aa96045').",
);
const defaultableChainId = makeDefaultableChainIdStringSchema().describe(
  "Chain ID as a string (e.g. '1' for Ethereum mainnet). Use '0' for the default EVM chain.",
);
const coinType = makeCoinTypeStringSchema();

const chainIdsWithoutDefaultChainId = z
  .optional(stringarray.pipe(z.array(defaultableChainId.pipe(excludingDefaultChainId))))
  .describe("Comma-separated list of chain IDs to resolve primary names for (e.g. '1,10,8453').");

const nameParamDescription =
  "Whether to include the reverse name record in the response," +
  "see ENSIP-3 (https://docs.ens.domains/ensip/3#resolver-interface). " +
  "Resolving the reverse 'name' resolver record is relevant as an internal implementation detail of the ENS reverse resolution process " +
  "where the primary ENS name associated with an address is being determined through a multi-step resolution process. " +
  "For example, querying the (unvalidated!) reverse 'name' resolver record for Vitalik's address (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045) " +
  "is achieved by resolving the reverse 'name' resolver record of the reverse name 'd8da6bf26964af9d7eed9e03e53415d37aa96045.addr.reverse' " +
  "which (at the time of writing) returns 'vitalik.eth'. " +
  "The ENS reverse resolution process requires that any reverse 'name' resolver record must also pass a forward-resolution validation " +
  "to be represented as the primary name for an address. " +
  "More details here: https://docs.ens.domains/web/reverse";

const rawSelectionParams = z.object({
  name: z
    .string()
    .optional()
    .describe(nameParamDescription)
    .openapi({
      enum: ["true", "false"],
    }),
  addresses: z
    .string()
    .optional()
    .describe(
      "Comma-separated list of coin types to resolve addresses for (e.g. '60' for ETH, '2147483658' for OP).",
    ),
  texts: z
    .string()
    .optional()
    .describe(
      "Comma-separated list of text record keys to resolve (e.g. 'avatar,description,url').",
    ),
});

const selectionFields = z.object({
  name: z.optional(boolstring),
  addresses: z.optional(stringarray.pipe(z.array(coinType))),
  texts: z.optional(stringarray),
});

type SelectionFields = z.output<typeof selectionFields>;

function toSelection(
  fields: SelectionFields,
  ctx: z.RefinementCtx,
): ResolverRecordsSelection | typeof z.NEVER {
  const sel: ResolverRecordsSelection = {
    ...(fields.name && { name: true }),
    ...(fields.addresses && { addresses: fields.addresses }),
    ...(fields.texts && { texts: fields.texts }),
  };

  if (isSelectionEmpty(sel)) {
    ctx.issues.push({ code: "custom", message: "Selection cannot be empty.", input: sel });
    return z.NEVER;
  }

  return sel;
}

const selection = selectionFields.transform(toSelection);

const resolveRecordsQuery = z
  .object({ ...selectionFields.shape, trace, accelerate })
  .transform(({ trace, accelerate, ...fields }, ctx) => {
    const sel = toSelection(fields, ctx);
    if (sel === z.NEVER) return z.NEVER;
    return { selection: sel, trace, accelerate };
  });

/**
 * Query Param Schema
 *
 * Allows treating a query param with no value as if the query param
 * value was 'undefined'.
 *
 * Note: This overrides a default behavior when the default value for
 * a query param is an empty string. Empty string causes an edge case
 * for query param value coercion into numbers:
 * ```ts
 * // empty string coercion into Number type
 * Number('') === 0;
 * ```
 *
 * The `preprocess` method replaces an empty string with `undefined` value,
 * and the output type is set to `unknown` to allow easy composition with
 * other specialized Zod schemas.
 */
const queryParam = z.preprocess((v) => (v === "" ? undefined : v), z.unknown());

export const params = {
  boolstring,
  stringarray,
  name,
  trace,
  accelerate,
  address,
  defaultableChainId,
  coinType,
  selectionParams: rawSelectionParams,
  selection,
  resolveRecordsQuery,
  chainIdsWithoutDefaultChainId,
  queryParam,
};
