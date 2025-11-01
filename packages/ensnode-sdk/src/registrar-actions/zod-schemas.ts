import { decodeEncodedReferrer, ENCODED_REFERRER_BYTE_LENGTH } from "@namehash/ens-referrals";
import type { Address } from "viem";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeDurationSchema,
  makeEventRefSchema,
  makeHexStringSchema,
  makeLowercaseAddressSchema,
  makePriceEthSchema,
} from "../internal";
import { CurrencyIds } from "../shared";
import { type RegistrarAction, RegistrarActionTypes, RegistrarEventNames } from "./types";

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

  if (registrarAction.baseCost.currency !== CurrencyIds.ETH) {
    ctx.issues.push({
      code: "custom",
      input: registrarAction,
      message: `'baseCost.currency' must set to '${CurrencyIds.ETH}'`,
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

/** Invariant: decodedReferrer is based on encodedReferrer */
function invariant_registrarActionDecodedReferrerBasedOnRawReferrer(
  ctx: ParsePayload<Pick<RegistrarAction, "encodedReferrer" | "decodedReferrer">>,
) {
  const registrarAction = ctx.value;
  // decodeEncodedReferrer returns checksummed address, but ENSNode work on lowercase address values
  // so we lowercase the result before using for checks
  const expectedDecodedReferrer = decodeEncodedReferrer(
    registrarAction.encodedReferrer,
  ).toLowerCase() as Address;

  if (registrarAction.decodedReferrer !== expectedDecodedReferrer) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'decodedReferrer' must be based on 'encodedReferrer'`,
    });
  }
}

const makeBaseRegistrarActionSchema = (valueLabel: string = "Base Registrar Action") =>
  z.object({
    node: makeHexStringSchema({ bytesCount: 32 }, `${valueLabel} Node`),

    baseCost: makePriceEthSchema(`${valueLabel} Base Cost`),
    premium: makePriceEthSchema(`${valueLabel} Premium`),
    total: makePriceEthSchema(`${valueLabel} Total`),

    incrementalDuration: makeDurationSchema(`${valueLabel} Incremental Duration`),

    registrant: makeLowercaseAddressSchema(`${valueLabel} Registrant`),
    encodedReferrer: makeHexStringSchema(
      { bytesCount: ENCODED_REFERRER_BYTE_LENGTH },
      `${valueLabel} Encoded Referrer`,
    ),
    decodedReferrer: makeLowercaseAddressSchema(`${valueLabel} Decoded Referrer`),
  });

export const makeRegistrarActionRegistrationSchema = (valueLabel: string = "Registration ") =>
  makeBaseRegistrarActionSchema(valueLabel)
    .extend({
      type: z.literal(RegistrarActionTypes.Registration),

      event: makeEventRefSchema({ eventNames: [RegistrarEventNames.NameRegistered] }, valueLabel),
    })
    .check(invariant_registrarActionTotalIsSumOfBaseCostAndPremium)
    .check(invariant_registrarActionDecodedReferrerBasedOnRawReferrer);

export const makeRegistrarActionRenewalSchema = (valueLabel: string = "Renewal") =>
  makeBaseRegistrarActionSchema(valueLabel)
    .extend({
      type: z.literal(RegistrarActionTypes.Renewal),

      event: makeEventRefSchema({ eventNames: [RegistrarEventNames.NameRenewed] }, valueLabel),

      premium: makePriceEthSchema(`${valueLabel} Premium`).refine((v) => v.amount === 0n, {
        error: `Renewal Premium must always be '0'`,
      }),
    })
    .check(invariant_registrarActionTotalIsSumOfBaseCostAndPremium)
    .check(invariant_registrarActionDecodedReferrerBasedOnRawReferrer);

/**
 * Schema for {@link RegistrarAction}.
 */
export const makeRegistrarActionSchema = (valueLabel: string = "Registrar Action") =>
  z.discriminatedUnion("type", [
    makeRegistrarActionRegistrationSchema(`${valueLabel}.Registration`),
    makeRegistrarActionRenewalSchema(`${valueLabel}.Renewal`),
  ]);
