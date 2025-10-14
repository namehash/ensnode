import { z } from "zod/v4";

import { DEFAULT_EVM_CHAIN_ID } from "../../ens/coin-type";
import { Name } from "../../ens/types";
import { ResolverRecordsSelection, isSelectionEmpty } from "../../resolution";
import { isNormalizedName } from "../../shared";
import {
  makeCoinTypeStringSchema,
  makeDefaultableChainIdStringSchema,
  makeDurationSchema,
  makeLowercaseAddressSchema,
} from "../../shared/zod-schemas";

const excludingDefaultChainId = z
  .number()
  .refine(
    (val) => val !== DEFAULT_EVM_CHAIN_ID,
    `Must not be the 'default' EVM chain id (${DEFAULT_EVM_CHAIN_ID}).`,
  );

const boolstring = z
  .string()
  .pipe(z.enum(["true", "false"]))
  .transform((val) => val === "true");

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
  .transform((val) => val as Name);

const trace = boolstring;
const accelerate = boolstring;
const address = makeLowercaseAddressSchema();
const defaultableChainId = makeDefaultableChainIdStringSchema();
const coinType = makeCoinTypeStringSchema();

const selection = {
  name: z.optional(boolstring),
  addresses: z.optional(stringarray.pipe(z.array(coinType))),
  texts: z.optional(stringarray),
};

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
const queryParamSchema = z.preprocess((v) => (v === "" ? undefined : v), z.unknown());

export const routes = {
  records: {
    params: z.object({ name }),
    query: z
      .object({
        ...selection,
        trace: z.optional(trace).default(false),
        accelerate: z.optional(accelerate).default(false),
      })
      .transform((query, ctx) => {
        const { name, addresses, texts, ...rest } = query;
        const selection: ResolverRecordsSelection = {
          ...(query.name && { name: true }),
          ...(query.addresses && { addresses: query.addresses }),
          ...(query.texts && { texts: query.texts }),
        };

        if (isSelectionEmpty(selection)) {
          ctx.issues.push({
            code: "custom",
            message: "Selection cannot be empty.",
            input: selection,
          });

          return z.NEVER;
        }

        return { ...rest, selection };
      }),
  },
  primaryName: {
    params: z.object({ address, chainId: defaultableChainId }),
    query: z.object({
      trace: z.optional(trace).default(false),
      accelerate: z.optional(accelerate).default(false),
    }),
  },
  primaryNames: {
    params: z.object({ address: address }),
    query: z.object({
      chainIds: z.optional(
        stringarray.pipe(z.array(defaultableChainId.pipe(excludingDefaultChainId))),
      ),
      trace: z.optional(trace).default(false),
      accelerate: z.optional(accelerate).default(false),
    }),
  },
};
