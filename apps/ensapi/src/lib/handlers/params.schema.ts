import {
  DEFAULT_EVM_CHAIN_ID,
  Name,
  ResolverRecordsSelection,
  isNormalizedName,
  isSelectionEmpty,
} from "@ensnode/ensnode-sdk";
import {
  makeCoinTypeStringSchema,
  makeDefaultableChainIdStringSchema,
  makeLowercaseAddressSchema,
} from "@ensnode/ensnode-sdk/internal";
import { z } from "zod/v4";

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

const trace = z.optional(boolstring).default(false);
const accelerate = z.optional(boolstring).default(false);
const address = makeLowercaseAddressSchema();
const defaultableChainId = makeDefaultableChainIdStringSchema();
const coinType = makeCoinTypeStringSchema();

const chainIdsWithoutDefaultChainId = z.optional(
  stringarray.pipe(z.array(defaultableChainId.pipe(excludingDefaultChainId))),
);

const selection = z.object({
  name: z.optional(boolstring),
  addresses: z.optional(stringarray.pipe(z.array(coinType))),
  texts: z.optional(stringarray),
});

type SelectionQueryParameters = z.infer<typeof selection>;

export const transformSelection = <VALUE extends SelectionQueryParameters>(
  value: VALUE,
  ctx: z.RefinementCtx<VALUE>,
) => {
  const { name, addresses, texts, ...rest } = value;
  const selection: ResolverRecordsSelection = {
    ...(value.name && { name: true }),
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

  return { ...rest, selection };
};

export const params = {
  boolstring,
  stringarray,
  name,
  trace,
  accelerate,
  address,
  defaultableChainId,
  coinType,
  selection,
  chainIdsWithoutDefaultChainId,
};
