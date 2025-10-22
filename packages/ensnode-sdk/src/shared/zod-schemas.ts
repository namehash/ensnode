import { type CoinType } from "@ensdomains/address-encoder";
import { type Address, type Hex, bytesToHex, hexToBytes, isAddress, isHex } from "viem";
/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import z from "zod/v4";
import { ENSNamespaceIds } from "../ens";
import { asLowerCaseAddress } from "./address";
import type {
  BlockRef,
  ChainId,
  Datetime,
  DefaultableChainId,
  Duration,
  UnixTimestamp,
} from "./types";

import { CurrencyIds, type Price } from "./currencies";

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
export const makeLowercaseAddressSchema = (valueLabel: string = "Value") =>
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

/**
 * Parses a numeric value as a port number.
 */
export const makePortSchema = (valueLabel: string = "Port") =>
  makePositiveIntegerSchema(valueLabel).max(65535, {
    error: `${valueLabel} must be an integer between 1 and 65535.`,
  });

/**
 * Make a schema for {@link Hex} representation of bytes array.
 */
export const makeHexStringSchema = (
  { expectedLength }: { expectedLength: number },
  valueLabel: string = "String representation of bytes",
) =>
  z
    .string()
    .check(function invariant_stringStartsWith0x(ctx) {
      if (!ctx.value.startsWith("0x")) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `${valueLabel} type must start with '0x'.`,
        });
      }
    })
    .check(function invariant_rawReferrerIs32Bytes(ctx) {
      const bytesString = ctx.value.slice(2);
      const bytesStringLength = bytesString.length / 2;

      if (bytesStringLength !== expectedLength) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `${valueLabel} must be represented by exactly ${expectedLength} bytes. Provided bytes count: ${bytesStringLength}.`,
        });
      }
    })
    .transform((v) => v as Hex);

/**
 * Schema for {@link Price} type.
 */
export const makePriceSchema = (valueLabel: string = "Cost") =>
  z.strictObject({
    currency: z.enum(Object.values(CurrencyIds), {
      error: `${valueLabel} currency must be a valid CurrencyId.`,
    }),

    amount: z.coerce
      .bigint({
        error: `${valueLabel} must represent a bigint.`,
      })
      .nonnegative({
        error: `${valueLabel} must not be negative.`,
      }),
  });
