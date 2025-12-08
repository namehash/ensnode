import z from "zod/v4";

import { makeNameTokenSchema, makeNodeSchema, makeUnixTimestampSchema } from "../../internal";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import {
  NameTokensResponse,
  NameTokensResponseCodes,
  NameTokensResponseError,
  NameTokensResponseErrorCodes,
  NameTokensResponseErrorGeneric,
  NameTokensResponseErrorUnknownNameContext,
  NameTokensResponseOk,
  RegisteredNameTokens,
} from "./response";

/**
 * Schema for {@link RegisteredNameTokens}.
 */
export const makeRegisteredNameTokenSchema = (valueLabel: string = "Registered Name Token") =>
  z.object({
    domainId: makeNodeSchema(`${valueLabel}.domainId`),
    tokens: z.array(makeNameTokenSchema(`${valueLabel}.tokens`)).nonempty(),
    expiresAt: makeUnixTimestampSchema(`${valueLabel}.expiresAt`),
  });

/**
 * Schema for {@link NameTokensResponseOk}
 */
export const makeNameTokensResponseOkSchema = (valueLabel: string = "Name Tokens Response OK") =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Ok),
    registeredNameTokens: makeRegisteredNameTokenSchema(`${valueLabel}.nameTokens`),
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
