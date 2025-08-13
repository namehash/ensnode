import { Address, getAddress } from "viem";
import { z } from "zod/v4";

import { CoinType, DEFAULT_EVM_CHAIN_ID } from "../../ens/coin-type";
import { Name } from "../../ens/types";
import { ResolverRecordsSelection, isSelectionEmpty } from "../../resolution";
import { ChainId, isNormalized } from "../../shared";

const toName = (val: string) => val as Name;
const toAddress = (val: string) => val as Address;
const toChainId = (val: number) => val as ChainId;
const toCoinType = (val: number) => val as CoinType;

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

// TODO: encoded label hashes
const name = z
  .string()
  .refine(isNormalized, "Must be normalized, see https://docs.ens.domains/resolution/names/")
  .transform(toName);

const address = z
  .string()
  .refine(
    (val) => {
      try {
        return getAddress(val) === val;
      } catch {
        return false;
      }
    },
    { error: "Must be a valid checksummed EVM Address" },
  )
  .transform(toAddress);

const trace = boolstring;
const accelerate = boolstring;
const chainId = z.coerce.number<string>().int().nonnegative().transform(toChainId);
const coinType = z.coerce.number<string>().int().nonnegative().transform(toCoinType);

const selection = {
  name: z.optional(boolstring),
  addresses: z.optional(stringarray.pipe(z.array(coinType))),
  texts: z.optional(stringarray),
};

export const routes = {
  records: {
    params: z.object({ name }),
    query: z
      .object({
        ...selection,
        trace: z.optional(trace).default(false),
        accelerate: z.optional(accelerate).default(true),
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
    params: z.object({ address, chainId }),
    query: z.object({
      trace: z.optional(trace).default(false),
      accelerate: z.optional(accelerate).default(true),
    }),
  },
  primaryNames: {
    params: z.object({ address: address }),
    query: z.object({
      chainIds: z.optional(stringarray.pipe(z.array(chainId.pipe(excludingDefaultChainId)))),
      trace: z.optional(trace).default(false),
      accelerate: z.optional(accelerate).default(true),
    }),
  },
};
