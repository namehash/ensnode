import type { CoinType } from "@ensdomains/address-encoder";
import { AccountId as CaipAccountId } from "caip";
import { type Address, type Hex, isAddress, isHex, size } from "viem";
/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import { z } from "zod/v4";

import { ENSNamespaceIds, type InterpretedName, Node } from "../ens";
import { asLowerCaseAddress } from "./address";
import { type CurrencyId, CurrencyIds, Price, type PriceEth } from "./currencies";
import { reinterpretName } from "./interpretation/reinterpretation";
import type { SerializedAccountId } from "./serialized-types";
import type {
  AccountId,
  BlockRef,
  ChainId,
  Datetime,
  DefaultableChainId,
  Duration,
  UnixTimestamp,
} from "./types";

/**
 * Zod `.check()` function input.
 */
export type ZodCheckFnInput<T> = z.core.ParsePayload<T>;

/**
 * Parses a string value as a boolean.
 */
export const makeBooleanStringSchema = (valueLabel: string = "Value") =>
  z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: `${valueLabel} must be 'true' or 'false'.`,
      }),
    )
    .transform((val) => val === "true");

/**
 * Parses a numeric value as an integer.
 */
export const makeIntegerSchema = (valueLabel: string = "Value") =>
  z.int({
    error: `${valueLabel} must be an integer.`,
  });

/**
 * Parses a numeric value as a positive integer.
 */
export const makePositiveIntegerSchema = (valueLabel: string = "Value") =>
  makeIntegerSchema(valueLabel).positive({
    error: `${valueLabel} must be a positive integer (>0).`,
  });

/**
 * Parses a numeric value as a non-negative integer.
 */
export const makeNonNegativeIntegerSchema = (valueLabel: string = "Value") =>
  makeIntegerSchema(valueLabel).nonnegative({
    error: `${valueLabel} must be a non-negative integer (>=0).`,
  });

/**
 * Parses a numeric value as {@link Duration}
 */
export const makeDurationSchema = (valueLabel: string = "Value") =>
  z.coerce
    .number({
      error: `${valueLabel} must be a number.`,
    })
    .pipe(makeNonNegativeIntegerSchema(valueLabel));

/**
 * Parses Chain ID
 *
 * {@link ChainId}
 */
export const makeChainIdSchema = (valueLabel: string = "Chain ID") =>
  makePositiveIntegerSchema(valueLabel).transform((val) => val as ChainId);

/**
 * Parses a serialized representation of {@link ChainId}.
 */
export const makeChainIdStringSchema = (valueLabel: string = "Chain ID String") =>
  z
    .string({ error: `${valueLabel} must be a string representing a chain ID.` })
    .pipe(z.coerce.number({ error: `${valueLabel} must represent a positive integer (>0).` }))
    .pipe(makeChainIdSchema(`The numeric value represented by ${valueLabel}`));

/**
 * Parses Defaultable Chain ID
 *
 * {@link DefaultableChainId}
 */
export const makeDefaultableChainIdSchema = (valueLabel: string = "Defaultable Chain ID") =>
  makeNonNegativeIntegerSchema(valueLabel).transform((val) => val as DefaultableChainId);

/**
 * Parses a serialized representation of {@link DefaultableChainId}.
 */
export const makeDefaultableChainIdStringSchema = (
  valueLabel: string = "Defaultable Chain ID String",
) =>
  z
    .string({ error: `${valueLabel} must be a string representing a chain ID.` })
    .pipe(z.coerce.number({ error: `${valueLabel} must represent a non-negative integer (>=0).` }))
    .pipe(makeDefaultableChainIdSchema(`The numeric value represented by ${valueLabel}`));

/**
 * Parses {@link CoinType}.
 */
export const makeCoinTypeSchema = (valueLabel: string = "Coin Type") =>
  z
    .number({ error: `${valueLabel} must be a number.` })
    .int({ error: `${valueLabel} must be an integer.` })
    .nonnegative({ error: `${valueLabel} must be a non-negative integer (>=0).` })
    .transform((val) => val as CoinType);

/**
 * Parses a serialized representation of {@link CoinType}.
 */
export const makeCoinTypeStringSchema = (valueLabel: string = "Coin Type String") =>
  z
    .string({ error: `${valueLabel} must be a string representing a coin type.` })
    .pipe(z.coerce.number({ error: `${valueLabel} must represent a non-negative integer (>=0).` }))
    .pipe(makeCoinTypeSchema(`The numeric value represented by ${valueLabel}`));

/**
 * Parses a serialized representation of an EVM address into a lowercase Address.
 */
export const makeLowercaseAddressSchema = (valueLabel: string = "EVM address") =>
  z
    .string()
    .check((ctx) => {
      if (!isAddress(ctx.value)) {
        ctx.issues.push({
          code: "custom",
          message: `${valueLabel} must be a valid EVM address`,
          input: ctx.value,
        });
      }
    })
    .transform((val) => asLowerCaseAddress(val as Address));

/**
 * Parses an ISO 8601 string representations of {@link Datetime}
 */
export const makeDatetimeSchema = (valueLabel: string = "Datetime string") =>
  z.iso
    .datetime({ error: `${valueLabel} must be a string in ISO 8601 format.` })
    .transform((v) => new Date(v));

/**
 * Parses value as {@link UnixTimestamp}.
 */
export const makeUnixTimestampSchema = (valueLabel: string = "Timestamp") =>
  makeIntegerSchema(valueLabel);

/**
 * Parses a string representations of {@link URL}
 */
export const makeUrlSchema = (valueLabel: string = "Value") =>
  z
    .url({
      error: `${valueLabel} must be a valid URL string (e.g., http://localhost:8080 or https://example.com).`,
      abort: true,
    })
    .transform((v) => new URL(v));

/**
 * Parses a serialized representation of a comma separated list.
 */
export const makeCommaSeparatedList = (valueLabel: string = "Value") =>
  z
    .string({ error: `${valueLabel} must be a comma separated list.` })
    .transform((val) => val.split(",").filter(Boolean))
    .refine((val) => val.length > 0, {
      error: `${valueLabel} must be a comma separated list with at least one value.`,
    });

/**
 * Parses a numeric value as a block number.
 */
export const makeBlockNumberSchema = (valueLabel: string = "Block number") =>
  makeNonNegativeIntegerSchema(valueLabel);

/**
 * Parses an object value as the {@link Blockrange} object.
 */
export const makeBlockrangeSchema = (valueLabel: string = "Value") =>
  z
    .strictObject(
      {
        startBlock: makeBlockNumberSchema(`${valueLabel}.startBlock`).optional(),
        endBlock: makeBlockNumberSchema(`${valueLabel}.endBlock`).optional(),
      },
      {
        error: `${valueLabel} must be a valid Blockrange object.`,
      },
    )
    .refine(
      (v) => {
        if (v.startBlock && v.endBlock) {
          return v.startBlock <= v.endBlock;
        }

        return true;
      },
      { error: `${valueLabel}: startBlock must be before or equal to endBlock` },
    );

/**
 * Parses an object value as the {@link BlockRef} object.
 */
export const makeBlockRefSchema = (valueLabel: string = "Value") =>
  z.strictObject(
    {
      timestamp: makeUnixTimestampSchema(`${valueLabel}.timestamp`),
      number: makeBlockNumberSchema(`${valueLabel}.number`),
    },
    {
      error: `${valueLabel} must be a valid BlockRef object.`,
    },
  );

/**
 * Parses a string value as ENSNamespaceId.
 */
export const makeENSNamespaceIdSchema = (valueLabel: string = "ENSNamespaceId") =>
  z.enum(ENSNamespaceIds, {
    error() {
      return `Invalid ${valueLabel}. Supported ENS namespace IDs are: ${Object.keys(ENSNamespaceIds).join(", ")}`;
    },
  });

const makePriceAmountSchema = (valueLabel: string = "Amount") =>
  z.coerce
    .bigint({
      error: `${valueLabel} must represent a bigint.`,
    })
    .nonnegative({
      error: `${valueLabel} must not be negative.`,
    });

export const makePriceCurrencySchema = (
  currency: CurrencyId,
  valueLabel: string = "Price Currency",
) =>
  z.strictObject({
    amount: makePriceAmountSchema(`${valueLabel} amount`),

    currency: z.literal(currency, {
      error: `${valueLabel} currency must be set to '${currency}'.`,
    }),
  });

/**
 * Schema for {@link Price} type.
 */
export const makePriceSchema = (valueLabel: string = "Price") =>
  z.discriminatedUnion(
    "currency",
    [
      makePriceCurrencySchema(CurrencyIds.ETH, valueLabel),
      makePriceCurrencySchema(CurrencyIds.USDC, valueLabel),
      makePriceCurrencySchema(CurrencyIds.DAI, valueLabel),
    ],
    { error: `${valueLabel} currency must be one of ${Object.values(CurrencyIds).join(", ")}` },
  );

/**
 * Schema for {@link PriceEth} type.
 */
export const makePriceEthSchema = (valueLabel: string = "Price ETH") =>
  makePriceCurrencySchema(CurrencyIds.ETH, valueLabel).transform((v) => v as PriceEth);

/**
 * Schema for {@link AccountId} type.
 */
export const makeAccountIdSchema = (valueLabel: string = "AccountId") =>
  z.strictObject({
    chainId: makeChainIdStringSchema(`${valueLabel} chain ID`),
    address: makeLowercaseAddressSchema(`${valueLabel} address`),
  });

/**
 * Schema for {@link SerializedAccountSchema} type.
 */
export const makeSerializedAccountIdSchema = (valueLabel: SerializedAccountId = "Account ID") =>
  z.coerce
    .string()
    .transform((v) => {
      const result = new CaipAccountId(v);

      return {
        chainId: result.chainId.reference,
        address: result.address,
      };
    })
    .pipe(makeAccountIdSchema(valueLabel));

/**
 * Make a schema for {@link Hex} representation of bytes array.
 *
 * @param {number} options.bytesCount expected count of bytes to be hex-encoded
 */
export const makeHexStringSchema = (
  options: { bytesCount: number },
  valueLabel: string = "String representation of bytes array",
) =>
  z
    .string()
    .check(function invariant_isHexEncoded(ctx) {
      if (!isHex(ctx.value)) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `${valueLabel} must start with '0x'.`,
        });
      }
    })
    .transform((v) => v as Hex)
    .check(function invariant_encodesRequiredBytesCount(ctx) {
      const expectedBytesCount = options.bytesCount;
      const actualBytesCount = size(ctx.value);

      if (actualBytesCount !== expectedBytesCount) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `${valueLabel} must represent exactly ${expectedBytesCount} bytes. Currently represented bytes count: ${actualBytesCount}.`,
        });
      }
    });

/**
 * Make schema for {@link Node}.
 */
export const makeNodeSchema = (valueLabel: string = "Node") =>
  makeHexStringSchema({ bytesCount: 32 }, valueLabel);

/**
 * Make schema for Transaction Hash
 */
export const makeTransactionHashSchema = (valueLabel: string = "Transaction hash") =>
  makeHexStringSchema({ bytesCount: 32 }, valueLabel);

/**
 * Make schema for {@link ReinterpretedName}.
 */
export const makeReinterpretedNameSchema = (valueLabel: string = "Reinterpreted Name") =>
  z
    .string()
    .transform((v) => v as InterpretedName)
    .check((ctx) => {
      try {
        reinterpretName(ctx.value);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `${valueLabel} cannot be reinterpreted: ${errorMessage}`,
        });
      }
    })
    .transform(reinterpretName);
