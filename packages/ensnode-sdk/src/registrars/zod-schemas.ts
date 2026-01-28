import { decodeEncodedReferrer, ENCODED_REFERRER_BYTE_LENGTH } from "@namehash/ens-referrals";
import type { Address } from "viem";
import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { addPrices, isPriceEqual } from "../shared";
import {
  makeAccountIdSchema,
  makeBlockRefSchema,
  makeDurationSchema,
  makeHexStringSchema,
  makeLowercaseAddressSchema,
  makeNodeSchema,
  makePriceEthSchema,
  makeSerializedPriceEthSchema,
  makeTransactionHashSchema,
  makeUnixTimestampSchema,
} from "../shared/zod-schemas";
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
  type SerializedRegistrarActionPricingAvailable,
  type SerializedRegistrarActionPricingUnknown,
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
const makeSerializedRegistrarActionPricingSchema = (
  valueLabel: string = "Serialized Registrar Action Pricing",
) => {
  const baseCostDescription = `Base cost (before any 'premium') of Ether measured in units of Wei paid to execute the "logical registrar action".`;
  const premiumDescription = `"premium" cost (in excesses of the 'baseCost') of Ether measured in units of Wei paid to execute the "logical registrar action".`;
  const totalDescription = `Total cost of Ether measured in units of Wei paid to execute the "logical registrar action".`;

  return z.union([
    // pricing available
    z
      .object({
        baseCost: makeSerializedPriceEthSchema(`${valueLabel} Base Cost`).meta({
          description: baseCostDescription,
        }),
        premium: makeSerializedPriceEthSchema(`${valueLabel} Premium`).meta({
          description: premiumDescription,
        }),
        total: makeSerializedPriceEthSchema(`${valueLabel} Total`).meta({
          description: totalDescription,
        }),
      })
      .transform((v) => v as SerializedRegistrarActionPricingAvailable),

    // pricing unknown
    z
      .object({
        baseCost: z.null().meta({ description: baseCostDescription }),
        premium: z.null().meta({ description: premiumDescription }),
        total: z.null().meta({ description: totalDescription }),
      })
      .transform((v) => v as SerializedRegistrarActionPricingUnknown),
  ]);
};

/** Invariant: decodedReferrer is based on encodedReferrer */
function invariant_registrarActionDecodedReferrerBasedOnRawReferrer(
  ctx: ParsePayload<RegistrarActionReferralAvailable>,
) {
  const { encodedReferrer, decodedReferrer } = ctx.value;

  try {
    // decodeEncodedReferrer returns checksummed address, but ENSNode work on lowercase address values
    // so we lowercase the result before using for checks
    const expectedDecodedReferrer = decodeEncodedReferrer(encodedReferrer).toLowerCase() as Address;

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
        decodedReferrer: makeLowercaseAddressSchema(`${valueLabel} Decoded Referrer`),
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

const registrarActionTypeDescription = `The type of "logical registrar action".`;

export const makeBaseRegistrarActionSchema = (valueLabel: string = "Base Registrar Action") =>
  z
    .object({
      id: EventIdSchema.meta({
        description: `The 'id' value is a deterministic and globally unique identifier for the "logical registrar action".`,
      }),
      incrementalDuration: makeDurationSchema(`${valueLabel} Incremental Duration`).meta({
        description: `The duration by which the "logical registrar action" extended the associated 'registrationLifecycle'.`,
      }),
      registrant: makeLowercaseAddressSchema(`${valueLabel} Registrant`).meta({
        description: `Identifies the address that initiated the "logical registrar action" and is paying the 'pricing.total' cost (if applicable).`,
      }),
      registrationLifecycle: makeRegistrationLifecycleSchema(
        `${valueLabel} Registration Lifecycle`,
      ).meta({
        description: `Registration Lifecycle associated with this "logical registrar action".`,
      }),
      type: z.string().meta({
        description: registrarActionTypeDescription,
      }),
      referral: makeRegistrarActionReferralSchema(`${valueLabel} Referral`).meta({
        description: `Referral information associated with this "logical registrar action".`,
      }),
      block: makeBlockRefSchema(`${valueLabel} Block`).meta({
        description: `References the block where the "logical registrar action" was executed.`,
      }),
      transactionHash: makeTransactionHashSchema(`${valueLabel} Transaction Hash`).meta({
        description: `Transaction hash of the transaction associated with the "logical registrar action".`,
      }),
      eventIds: EventIdsSchema.meta({
        description: `Array of the eventIds that have contributed to the state of the "logical registrar action" record.`,
      }),
    })
    .check(invariant_eventIdsInitialElementIsTheActionId);

const pricingInfoDescription = `Pricing information associated with this "logical registrar action".`;

export const makeRegistrarActionRegistrationSchema = (valueLabel: string = "Registration ") =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Registration).meta({
      description: registrarActionTypeDescription,
    }),

    pricing: makeRegistrarActionPricingSchema(`${valueLabel} Pricing`).meta({
      description: pricingInfoDescription,
    }),
  });

export const makeSerializedRegistrarActionRegistrationSchema = (
  valueLabel: string = "SerializedRegistration ",
) =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Registration).meta({
      description: registrarActionTypeDescription,
    }),

    pricing: makeSerializedRegistrarActionPricingSchema(`${valueLabel} Pricing`).meta({
      description: pricingInfoDescription,
    }),
  });

export const makeRegistrarActionRenewalSchema = (valueLabel: string = "Renewal") =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Renewal).meta({
      description: registrarActionTypeDescription,
    }),
    pricing: makeRegistrarActionPricingSchema(`${valueLabel} Pricing`).meta({
      description: pricingInfoDescription,
    }),
  });

export const makeSerializedRegistrarActionRenewalSchema = (
  valueLabel: string = "Serialized Renewal",
) =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Renewal).meta({
      description: registrarActionTypeDescription,
    }),
    pricing: makeSerializedRegistrarActionPricingSchema(`${valueLabel} Pricing`).meta({
      description: pricingInfoDescription,
    }),
  });

/**
 * Schema for {@link RegistrarAction}.
 */
export const makeRegistrarActionSchema = (valueLabel: string = "Registrar Action") =>
  z.discriminatedUnion("type", [
    makeRegistrarActionRegistrationSchema(`${valueLabel} Registration`),
    makeRegistrarActionRenewalSchema(`${valueLabel} Renewal`),
  ]);

/**
 * Schema for {@link SerializedRegistrarAction}.
 */
export const makeSerializedRegistrarActionSchema = (
  valueLabel: string = "Serialized Registrar Action",
) =>
  z.discriminatedUnion("type", [
    makeSerializedRegistrarActionRegistrationSchema(`${valueLabel} Registration`),
    makeSerializedRegistrarActionRenewalSchema(`${valueLabel} Renewal`),
  ]);
