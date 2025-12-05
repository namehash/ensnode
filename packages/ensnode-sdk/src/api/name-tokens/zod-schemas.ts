import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeNameTokenSchema,
  makeRegistrationLifecycleSchema,
  makeUnixTimestampSchema,
} from "../../internal";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import {
  NameTokensResponse,
  NameTokensResponseCodes,
  NameTokensResponseError,
  NameTokensResponseErrorCodes,
  NameTokensResponseErrorGeneric,
  NameTokensResponseErrorUnknownNameContext,
  NameTokensResponseOk,
  type RegisteredNameToken,
  RegisteredNameTokenStatuses,
} from "./response";

function invariant_registrationLifecycleNodeMatchesDomainId(
  ctx: ParsePayload<RegisteredNameToken>,
) {
  const { token, registrationLifecycle } = ctx.value;

  if (token.domainAsset.domainId !== registrationLifecycle.node) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `The 'registrationLifecycle.node' must be same as 'token.domainAsset.domainId'`,
    });
  }
}

/**
 * Schema for {@link RegisteredNameToken}.
 */
export const makeRegisteredNameTokenSchema = (valueLabel: string = "Registered Name Token") =>
  z
    .object({
      token: makeNameTokenSchema(valueLabel),
      registrationLifecycle: makeRegistrationLifecycleSchema(valueLabel),
      tokenStatus: z.enum(RegisteredNameTokenStatuses),
    })
    .check(invariant_registrationLifecycleNodeMatchesDomainId);

/**
 * Schema for {@link NameTokensResponseOk}
 */
export const makeNameTokensResponseOkSchema = (valueLabel: string = "Name Tokens Response OK") =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Ok),
    nameTokens: z.array(makeRegisteredNameTokenSchema(`${valueLabel}.nameTokens`)),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link NameTokensResponseErrorUnknownNameContext}
 */
export const makeNameTokensResponseErrorUnknownNameContextSchema = (
  _valueLabel: string = "Name Tokens Response Error Unknown Name Context",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.UnknownNameContext),
    error: ErrorResponseSchema,
  });

/**
 * Schema for {@link NameTokensResponseErrorGeneric}
 */
export const makeNameTokensResponseErrorGenericSchema = (
  _valueLabel: string = "Name Tokens Response Error Generic",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.UnknownNameContext),
    error: ErrorResponseSchema,
  });

/**
 * Schema for {@link NameTokensResponseError}
 */
export const makeNameTokensResponseErrorSchema = (
  valueLabel: string = "Name Tokens Response Error",
) =>
  z.discriminatedUnion("errorCode", [
    makeNameTokensResponseErrorUnknownNameContextSchema(valueLabel),
    makeNameTokensResponseErrorGenericSchema(valueLabel),
  ]);

/**
 * Schema for {@link NameTokensResponse}
 */
export const makeNameTokensResponseSchema = (valueLabel: string = "Name Tokens Response") =>
  z.discriminatedUnion("responseCode", [
    makeNameTokensResponseOkSchema(valueLabel),
    makeNameTokensResponseErrorSchema(valueLabel),
  ]);
