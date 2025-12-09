import z from "zod/v4";

import {
  makeNodeSchema,
  makeReinterpretedNameSchema,
  makeUnixTimestampSchema,
} from "../../shared/zod-schemas";
import { makeNameTokenSchema } from "../../tokenscope/zod-schemas";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import {
  NameTokensResponse,
  NameTokensResponseCodes,
  NameTokensResponseError,
  NameTokensResponseErrorCodes,
  NameTokensResponseErrorEnsIndexerConfigUnsupported,
  NameTokensResponseErrorIndexingStatusUnsupported,
  NameTokensResponseErrorNameNotIndexed,
  NameTokensResponseOk,
  RegisteredNameTokens,
} from "./response";

/**
 * Schema for {@link RegisteredNameTokens}.
 */
export const makeRegisteredNameTokenSchema = (valueLabel: string = "Registered Name Token") =>
  z.object({
    domainId: makeNodeSchema(`${valueLabel}.domainId`),
    name: makeReinterpretedNameSchema(valueLabel),
    tokens: z.array(makeNameTokenSchema(`${valueLabel}.tokens`)).nonempty(),
    expiresAt: makeUnixTimestampSchema(`${valueLabel}.expiresAt`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link NameTokensResponseOk}
 */
export const makeNameTokensResponseOkSchema = (valueLabel: string = "Name Tokens Response OK") =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Ok),
    registeredNameTokens: makeRegisteredNameTokenSchema(`${valueLabel}.nameTokens`),
  });

/**
 * Schema for {@link NameTokensResponseErrorNameNotIndexed}
 */
export const makeNameTokensResponseErrorNameNotIndexedSchema = (
  _valueLabel: string = "Name Tokens Response Error Name Not Indexed",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.NameNotIndexed),
    error: ErrorResponseSchema,
  });

/**
 * Schema for {@link NameTokensResponseErrorEnsIndexerConfigUnsupported}
 */
export const makeNameTokensResponseErrorEnsIndexerConfigUnsupported = (
  _valueLabel: string = "Name Tokens Response Error ENSIndexer Config Unsupported",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.EnsIndexerConfigUnsupported),
    error: ErrorResponseSchema,
  });
/**
 * Schema for {@link NameTokensResponseErrorIndexingStatusUnsupported}
 */
export const makeNameTokensResponseErrorNameIndexingStatusUnsupported = (
  _valueLabel: string = "Name Tokens Response Error Indexing Status Unsupported",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.IndexingStatusUnsupported),
    error: ErrorResponseSchema,
  });
/**
 * Schema for {@link NameTokensResponseError}
 */
export const makeNameTokensResponseErrorSchema = (
  valueLabel: string = "Name Tokens Response Error",
) =>
  z.discriminatedUnion("errorCode", [
    makeNameTokensResponseErrorNameNotIndexedSchema(valueLabel),
    makeNameTokensResponseErrorEnsIndexerConfigUnsupported(valueLabel),
    makeNameTokensResponseErrorNameIndexingStatusUnsupported(valueLabel),
  ]);

/**
 * Schema for {@link NameTokensResponse}
 */
export const makeNameTokensResponseSchema = (valueLabel: string = "Name Tokens Response") =>
  z.discriminatedUnion("responseCode", [
    makeNameTokensResponseOkSchema(valueLabel),
    makeNameTokensResponseErrorSchema(valueLabel),
  ]);
