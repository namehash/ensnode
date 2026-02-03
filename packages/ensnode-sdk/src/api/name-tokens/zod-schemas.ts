import { namehash } from "viem";
import { z } from "zod/v4";

import {
  makeNodeSchema,
  makeReinterpretedNameSchema,
  makeUnixTimestampSchema,
} from "../../shared/zod-schemas";
import { NameTokenOwnershipTypes } from "../../tokenscope";
import { makeNameTokenSchema } from "../../tokenscope/zod-schemas";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import {
  NameTokensResponse,
  NameTokensResponseCodes,
  NameTokensResponseError,
  NameTokensResponseErrorCodes,
  NameTokensResponseErrorEnsIndexerConfigUnsupported,
  NameTokensResponseErrorIndexingStatusUnsupported,
  NameTokensResponseErrorNameTokensNotIndexed,
  NameTokensResponseOk,
  type RegisteredNameTokens,
} from "./response";

/**
 * Schema for {@link RegisteredNameTokens}.
 */
export const makeRegisteredNameTokenSchema = <const SerializableType extends boolean>(
  valueLabel: string = "Registered Name Token",
  serializable?: SerializableType,
) =>
  z
    .object({
      domainId: makeNodeSchema(`${valueLabel}.domainId`),
      name: makeReinterpretedNameSchema(valueLabel),
      tokens: z.array(makeNameTokenSchema(`${valueLabel}.tokens`, serializable)).nonempty(),
      expiresAt: makeUnixTimestampSchema(`${valueLabel}.expiresAt`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .check(function invariant_nameIsAssociatedWithDomainId(ctx) {
      const { name, domainId } = ctx.value;

      if (namehash(name) !== domainId) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `'name' must be associated with 'domainId': ${domainId}`,
        });
      }
    })
    .check(
      function invariant_nameTokensOwnershipTypeNameWrapperRequiresOwnershipTypeFullyOnchainOrUnknown(
        ctx,
      ) {
        const { tokens } = ctx.value;
        const containsOwnershipNameWrapper = tokens.some(
          (t) => t.ownership.ownershipType === NameTokenOwnershipTypes.NameWrapper,
        );
        const containsOwnershipFullyOnchainOrUnknown = tokens.some(
          (t) =>
            t.ownership.ownershipType === NameTokenOwnershipTypes.FullyOnchain ||
            t.ownership.ownershipType === NameTokenOwnershipTypes.Unknown,
        );
        if (containsOwnershipNameWrapper && !containsOwnershipFullyOnchainOrUnknown) {
          ctx.issues.push({
            code: "custom",
            input: ctx.value,
            message: `'tokens' must contain name token with ownership type 'fully-onchain' or 'unknown' when name token with ownership type 'namewrapper' in listed`,
          });
        }
      },
    )
    .check(function invariant_nameTokensContainAtMostOneWithOwnershipTypeEffective(ctx) {
      const { tokens } = ctx.value;
      const tokensCountWithOwnershipFullyOnchain = tokens.filter(
        (t) => t.ownership.ownershipType === NameTokenOwnershipTypes.FullyOnchain,
      ).length;
      if (tokensCountWithOwnershipFullyOnchain > 1) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `'tokens' must contain at most one name token with ownership type 'fully-onchain', current count: ${tokensCountWithOwnershipFullyOnchain}`,
        });
      }
    });

/**
 * Schema for {@link NameTokensResponseOk}
 */
export const makeNameTokensResponseOkSchema = <const SerializableType extends boolean>(
  valueLabel: string = "Name Tokens Response OK",
  serializable?: SerializableType,
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Ok),
    registeredNameTokens: makeRegisteredNameTokenSchema(`${valueLabel}.nameTokens`, serializable),
  });

/**
 * Schema for {@link NameTokensResponseErrorNameTokensNotIndexed}
 */
export const makeNameTokensResponseErrorNameTokensNotIndexedSchema = (
  _valueLabel: string = "Name Tokens Response Error Name Not Indexed",
) =>
  z.strictObject({
    responseCode: z.literal(NameTokensResponseCodes.Error),
    errorCode: z.literal(NameTokensResponseErrorCodes.NameTokensNotIndexed),
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
    makeNameTokensResponseErrorNameTokensNotIndexedSchema(valueLabel),
    makeNameTokensResponseErrorEnsIndexerConfigUnsupported(valueLabel),
    makeNameTokensResponseErrorNameIndexingStatusUnsupported(valueLabel),
  ]);

/**
 * Schema for {@link NameTokensResponse}
 */
export const makeNameTokensResponseSchema = <const SerializableType extends boolean = false>(
  valueLabel: string = "Name Tokens Response",
  serializable?: SerializableType,
) => {
  return z.discriminatedUnion("responseCode", [
    makeNameTokensResponseOkSchema(valueLabel, serializable ?? false),
    makeNameTokensResponseErrorSchema(valueLabel),
  ]);
};
