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
  .transform((val) => val as Name);

const trace = z.optional(boolstring).default(false).openapi({ default: false });
const accelerate = z.optional(boolstring).default(false).openapi({ default: false });
const address = makeNormalizedAddressSchema();
const defaultableChainId = makeDefaultableChainIdStringSchema();
const coinType = makeCoinTypeStringSchema();

const chainIdsWithoutDefaultChainId = z.optional(
  stringarray.pipe(z.array(defaultableChainId.pipe(excludingDefaultChainId))),
);

const contentTypeBitmask = z
  .string()
  .transform((val, ctx) => {
    try {
      const n = BigInt(val);
      if (n <= 0n) {
        ctx.issues.push({
          code: "custom",
          message: "Must be a positive integer.",
          input: val,
        });
        return z.NEVER;
      }
      return n;
    } catch {
      ctx.issues.push({
        code: "custom",
        message: "Must be a valid positive integer string.",
        input: val,
      });
      return z.NEVER;
    }
  })
  .openapi({ type: "string", example: "1" });

const interfaceId = z
  .string()
  .regex(/^0x[0-9a-f]{8}$/i, "Must be a 4-byte hex (0x + 8 hex chars)")
  .transform((val) => val.toLowerCase() as `0x${string}`);

const rawSelectionParams = z.object({
  name: z.string().optional(),
  addresses: z.string().optional(),
  texts: z.string().optional(),
  contenthash: z.string().optional(),
  pubkey: z.string().optional(),
  dnszonehash: z.string().optional(),
  version: z.string().optional(),
  abi: z.string().optional(),
  interfaces: z.string().optional(),
});

const selectionFields = z.object({
  name: z.optional(boolstring),
  addresses: z.optional(stringarray.pipe(z.array(coinType))),
  texts: z.optional(stringarray),
  contenthash: z.optional(boolstring),
  pubkey: z.optional(boolstring),
  dnszonehash: z.optional(boolstring),
  version: z.optional(boolstring),
  abi: z.optional(contentTypeBitmask),
  interfaces: z.optional(stringarray.pipe(z.array(interfaceId))),
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
    ...(fields.contenthash && { contenthash: true }),
    ...(fields.pubkey && { pubkey: true }),
    ...(fields.dnszonehash && { dnszonehash: true }),
    ...(fields.version && { version: true }),
    ...(fields.abi !== undefined && { abi: fields.abi }),
    ...(fields.interfaces && { interfaces: fields.interfaces }),
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
