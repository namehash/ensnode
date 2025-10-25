import z from "zod/v4";
import { ParsePayload } from "zod/v4/core";
import {
  makeChainIdSchema,
  makeHexStringSchema,
  makeLowercaseAddressSchema,
  makePriceSchema,
  makeUnixTimestampSchema,
} from "../internal";
import { interpretRawReferrer } from "./helpers";
import { type RegistrarAction, RegistrarActionType } from "./types";

/** Invariant: total is sum of baseCost and premium */
function invariant_registrarActionTotalIsSumOfBaseCostAndPremium(
  ctx: ParsePayload<Pick<RegistrarAction, "baseCost" | "premium" | "total">>,
) {
  const registrarAction = ctx.value;

  if (
    registrarAction.total.amount !==
    registrarAction.baseCost.amount + registrarAction.premium.amount
  ) {
    ctx.issues.push({
      code: "custom",
      input: registrarAction,
      message: `'total' must be equal to the sum of 'baseCost' and 'premium'`,
    });
  }

  if (registrarAction.total.currency !== registrarAction.baseCost.currency) {
    ctx.issues.push({
      code: "custom",
      input: registrarAction,
      message: `'total.currency' must be equal to 'baseCost.currency'`,
    });
  }

  if (registrarAction.total.currency !== registrarAction.premium.currency) {
    ctx.issues.push({
      code: "custom",
      input: registrarAction,
      message: `'total.currency' must be equal to 'premium.currency'`,
    });
  }
}

/** Invariant: interpretedReferrer is based on rawReferrer */
function invariant_registrarActionInterpretedReferrerBasedOnRawReferrer(
  ctx: ParsePayload<Pick<RegistrarAction, "rawReferrer" | "interpretedReferrer">>,
) {
  const registrarAction = ctx.value;
  const expectedInterpretedReferrer = interpretRawReferrer(registrarAction.rawReferrer);

  console.log({
    actual: registrarAction.interpretedReferrer,
    expectedInterpretedReferrer,
  });

  if (registrarAction.interpretedReferrer !== expectedInterpretedReferrer) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'interpretedReferrer' must be based on 'rawReferrer'`,
    });
  }
}

const makeBaseRegistrarActionSchema = (valueLabel: string = "Base Registrar Action") =>
  z.object({
    node: makeHexStringSchema({ expectedLength: 32 }, `${valueLabel} Node`),

    baseCost: makePriceSchema(`${valueLabel} Base Cost`),
    premium: makePriceSchema(`${valueLabel} Premium`),
    total: makePriceSchema(`${valueLabel} Total`),

    registrant: makeLowercaseAddressSchema(`${valueLabel} Registrant`),
    rawReferrer: makeHexStringSchema({ expectedLength: 32 }, `${valueLabel} Raw Referrer`),
    interpretedReferrer: makeLowercaseAddressSchema(`${valueLabel} Interpreted Referrer`),

    blockTimestamp: makeUnixTimestampSchema(`${valueLabel} Block Timestamp`),
    chainId: makeChainIdSchema(`${valueLabel} Chain ID`),
    transactionHash: makeHexStringSchema({ expectedLength: 32 }, `${valueLabel} Transaction Hash`),
  });

export const makeRegistrarActionRegistrationSchema = (valueLabel: string = "Registration ") =>
  makeBaseRegistrarActionSchema(valueLabel)
    .extend({
      type: z.literal(RegistrarActionType.Registration),
    })
    .check(invariant_registrarActionTotalIsSumOfBaseCostAndPremium)
    .check(invariant_registrarActionInterpretedReferrerBasedOnRawReferrer);

export const makeRegistrarActionRenewalSchema = (valueLabel: string = "Renewal") =>
  makeBaseRegistrarActionSchema(valueLabel)
    .extend({
      type: z.literal(RegistrarActionType.Renewal),

      premium: makePriceSchema(`${valueLabel} Premium`).refine((v) => v.amount === 0n, {
        error: `Renewal Premium must always be '0'`,
      }),
    })
    .check(invariant_registrarActionTotalIsSumOfBaseCostAndPremium)
    .check(invariant_registrarActionInterpretedReferrerBasedOnRawReferrer);

/**
 * Schema for {@link RegistrarAction}.
 */
export const makeRegistrarActionSchema = (valueLabel: string = "Registrar Action") =>
  z.discriminatedUnion("type", [
    makeRegistrarActionRegistrationSchema(`${valueLabel}.Registration`),
    makeRegistrarActionRenewalSchema(`${valueLabel}.Renewal`),
  ]);
