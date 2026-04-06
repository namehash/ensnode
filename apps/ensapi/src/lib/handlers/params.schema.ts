import { z } from "@hono/zod-openapi";

import {
  DEFAULT_EVM_CHAIN_ID,
  isNormalizedName,
  isSelectionEmpty,
  type Name,
  type ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import {
  makeCoinTypeStringSchema,
  makeDefaultableChainIdStringSchema,
  makeLowercaseAddressSchema,
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
  .describe("Include detailed resolution trace information in the response.")
  .openapi({ default: false });

const accelerate = z
  .optional(boolstring)
  .default(false)
  .describe("Attempt accelerated CCIP-Read resolution using L1 data.")
  .openapi({
    default: false,
  });
const address = makeLowercaseAddressSchema().describe(
  "EVM wallet address (e.g. '0xd8da6bf26964af9d7eed9e03e53415d37aa96045').",
);
const defaultableChainId = makeDefaultableChainIdStringSchema().describe(
  "Chain ID as a string (e.g. '1' for Ethereum mainnet). Use '0' for the default EVM chain.",
);
const coinType = makeCoinTypeStringSchema();

const chainIdsWithoutDefaultChainId = z
  .optional(stringarray.pipe(z.array(defaultableChainId.pipe(excludingDefaultChainId))))
  .describe(
    "Comma-separated list of chain IDs to resolve primary names for (e.g. '1,10,8453'). The default EVM chain ID (0) is not allowed.",
  );

const rawSelectionParams = z.object({
  nameRecord: z
    .string()
    .optional()
    .describe("Whether to include the ENS name record in the response.")
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

const selection = z
  .object({
    nameRecord: z.optional(boolstring),
    addresses: z.optional(stringarray.pipe(z.array(coinType))),
    texts: z.optional(stringarray),
  })
  .transform((value, ctx) => {
    const selection: ResolverRecordsSelection = {
      ...(value.nameRecord && { name: true }),
      ...(value.addresses && { addresses: value.addresses }),
      ...(value.texts && { texts: value.texts }),
    };

    if (isSelectionEmpty(selection)) {
      ctx.issues.push({
        code: "custom",
        message: "Selection cannot be empty.",
        input: selection,
      });

      return z.NEVER;
    }

    return selection;
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
  chainIdsWithoutDefaultChainId,
  queryParam,
};
