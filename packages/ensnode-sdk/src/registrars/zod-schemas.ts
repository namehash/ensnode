import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { addPrices, isPriceEqual } from "../shared/currencies";
import {
  makeAccountIdSchema,
  makeBlockRefSchema,
  makeDurationSchema,
  makeHexStringSchema,
  makeNodeSchema,
  makeNormalizedAddressSchema,
  makePriceEthSchema,
  makeSerializedPriceEthSchema,
  makeTransactionHashSchema,
  makeUnixTimestampSchema,
} from "../shared/zod-schemas";
import { decodeEncodedReferrer, ENCODED_REFERRER_BYTE_LENGTH } from "./encoded-referrer";
import {
  type RegistrarAction,
  type RegistrarActionEventId,
  RegistrarActionPricing,
  type RegistrarActionPricingAvailable,
  type RegistrarActionPricingUnknown,
  type RegistrarActionReferralAvailable,
  RegistrarActionTypes,
  SerializedRegistrarAction,
  SerializedRegistrarActionPricing,
} from "./registrar-action";
import type { RegistrationLifecycle } from "./registration-lifecycle";
import { Subregistry } from "./subregistry";

/**
 * Schema for parsing objects into {@link Subregistry}.
 */
const makeSubregistrySchema = (valueLabel: string = "Subregistry") =>
  z.object({
    subregistryId: makeAccountIdSchema(`${valueLabel} Subregistry ID`),
    node: makeNodeSchema(`${valueLabel} Node`),
  });

/**
 * Schema for parsing objects into {@link RegistrationLifecycle}.
 */
export const makeRegistrationLifecycleSchema = (valueLabel: string = "Registration Lifecycle") =>
  z.object({
    subregistry: makeSubregistrySchema(`${valueLabel} Subregistry`),
    node: makeNodeSchema(`${valueLabel} Node`),
    expiresAt: makeUnixTimestampSchema(`${valueLabel} Expires at`),
  });

/** Invariant: total is sum of baseCost and premium */
function invariant_registrarActionPricingTotalIsSumOfBaseCostAndPremium(
  ctx: ParsePayload<RegistrarActionPricingAvailable>,
) {
  const { baseCost, premium, total } = ctx.value;
  const actualTotal = addPrices(baseCost, premium);

  if (!isPriceEqual(actualTotal, total)) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'total' must be equal to the sum of 'baseCost' and 'premium'`,
    });
  }
}

/**
 * Schema for parsing objects into {@link RegistrarActionPricing}.
 */
const makeRegistrarActionPricingSchema = (valueLabel: string = "Registrar Action Pricing") =>
  z.union([
    // pricing available
    z
      .object({
        baseCost: makePriceEthSchema(`${valueLabel} Base Cost`),
        premium: makePriceEthSchema(`${valueLabel} Premium`),
        total: makePriceEthSchema(`${valueLabel} Total`),
      })
      .check(invariant_registrarActionPricingTotalIsSumOfBaseCostAndPremium)
      .transform((v) => v as RegistrarActionPricingAvailable),

    // pricing unknown
    z
      .object({
        baseCost: z.null(),
        premium: z.null(),
        total: z.null(),
      })
      .transform((v) => v as RegistrarActionPricingUnknown),
  ]);

/**
 * Schema for parsing objects into {@link SerializedRegistrarActionPricing}.
 */
export const makeSerializedRegistrarActionPricingSchema = (
  valueLabel: string = "Serialized Registrar Action Pricing",
) =>
  z.union([
    // pricing available
    z.object({
      baseCost: makeSerializedPriceEthSchema(`${valueLabel} Base Cost`),
      premium: makeSerializedPriceEthSchema(`${valueLabel} Premium`),
      total: makeSerializedPriceEthSchema(`${valueLabel} Total`),
    }),
    // pricing unknown
    z.object({
      baseCost: z.null(),
      premium: z.null(),
      total: z.null(),
    }),
  ]);

/** Invariant: decodedReferrer is based on encodedReferrer */
function invariant_registrarActionDecodedReferrerBasedOnRawReferrer(
  ctx: ParsePayload<RegistrarActionReferralAvailable>,
) {
  const { encodedReferrer, decodedReferrer } = ctx.value;

  try {
    const expectedDecodedReferrer = decodeEncodedReferrer(encodedReferrer);

    if (decodedReferrer !== expectedDecodedReferrer) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `'decodedReferrer' must be based on 'encodedReferrer'`,
      });
    }
  } catch (error) {
    // in case decoding the encodedReferrer value could not succeed
    // pass the decoding error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: errorMessage,
    });
  }
}

const makeRegistrarActionReferralSchema = (valueLabel: string = "Registrar Action Referral") =>
  z.union([
    // referral available
    z
      .object({
        encodedReferrer: makeHexStringSchema(
          { bytesCount: ENCODED_REFERRER_BYTE_LENGTH },
          `${valueLabel} Encoded Referrer`,
        ),
        decodedReferrer: makeNormalizedAddressSchema(`${valueLabel} Decoded Referrer`),
      })
      .check(invariant_registrarActionDecodedReferrerBasedOnRawReferrer),

    // referral not applicable
    z.object({
      encodedReferrer: z.null(),
      decodedReferrer: z.null(),
    }),
  ]);

function invariant_eventIdsInitialElementIsTheActionId(
  ctx: ParsePayload<Pick<RegistrarAction, "id" | "eventIds">>,
) {
  const { id, eventIds } = ctx.value;

  if (eventIds[0] !== id) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "The initial element of `eventIds` must be the `id` value",
    });
  }
}

const EventIdSchema = z.string().nonempty();

const EventIdsSchema = z
  .array(EventIdSchema)
  .min(1)
  .transform((v) => v as [RegistrarActionEventId, ...RegistrarActionEventId[]]);

// Base schema without refinements - can be extended
const makeBaseRegistrarActionSchemaWithoutCheck = (valueLabel: string = "Base Registrar Action") =>
  z.object({
    id: EventIdSchema,
    incrementalDuration: makeDurationSchema(`${valueLabel} Incremental Duration`),
    registrant: makeNormalizedAddressSchema(`${valueLabel} Registrant`),
    registrationLifecycle: makeRegistrationLifecycleSchema(`${valueLabel} Registration Lifecycle`),
    pricing: makeRegistrarActionPricingSchema(`${valueLabel} Pricing`),
    referral: makeRegistrarActionReferralSchema(`${valueLabel} Referral`),
    block: makeBlockRefSchema(`${valueLabel} Block`),
    transactionHash: makeTransactionHashSchema(`${valueLabel} Transaction Hash`),
    eventIds: EventIdsSchema,
  });

// Base schema with refinements - used for parsing/validation
export const makeBaseRegistrarActionSchema = (valueLabel: string = "Base Registrar Action") =>
  makeBaseRegistrarActionSchemaWithoutCheck(valueLabel).check(
    invariant_eventIdsInitialElementIsTheActionId,
  );

export const makeRegistrarActionRegistrationSchema = (valueLabel: string = "Registration ") =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Registration),
  });

export const makeRegistrarActionRenewalSchema = (valueLabel: string = "Renewal") =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Renewal),
  });

/**
 * Schema for {@link RegistrarAction}.
 */
export const makeRegistrarActionSchema = (valueLabel: string = "Registrar Action") =>
  z.discriminatedUnion("type", [
    makeRegistrarActionRegistrationSchema(`${valueLabel} Registration`),
    makeRegistrarActionRenewalSchema(`${valueLabel} Renewal`),
  ]);

const makeSerializedBaseRegistrarActionSchema = (
  valueLabel: string = "Serialized Base Registrar Action",
) =>
  makeBaseRegistrarActionSchemaWithoutCheck(valueLabel).extend({
    pricing: makeSerializedRegistrarActionPricingSchema(`${valueLabel} Pricing`),
  });

const makeSerializedRegistrarActionRegistrationSchema = (
  valueLabel: string = "Serialized Registration",
) =>
  makeSerializedBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Registration),
  });

const makeSerializedRegistrarActionRenewalSchema = (valueLabel: string = "Serialized Renewal") =>
  makeSerializedBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Renewal),
  });

/**
 * Schema for  {@link SerializedRegistrarAction}
 */
export const makeSerializedRegistrarActionSchema = (
  valueLabel: string = "Serialized Registrar Action",
) =>
  z.discriminatedUnion("type", [
    makeSerializedRegistrarActionRegistrationSchema(`${valueLabel} Registration`),
    makeSerializedRegistrarActionRenewalSchema(`${valueLabel} Renewal`),
  ]);
