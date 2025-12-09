import { namehash } from "viem";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

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
  NameTokensResponseErrorNameNotIndexed,
  NameTokensResponseOk,
  type RegisteredNameTokens,
} from "./response";

function invariant_nameIsAssociatedWithDomainId(ctx: ParsePayload<RegisteredNameTokens>) {
  const { name, domainId } = ctx.value;

  if (namehash(name) !== domainId) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'name' must be associated with 'domainId': ${domainId}`,
    });
  }
}

function invariant_nameTokensOwnershipTypeProxyRequiresOwnershipTypeFullyOnchainOrUnknown(
  ctx: ParsePayload<RegisteredNameTokens>,
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
}

function invariant_nameTokensContainAtMostOneWithOwnershipTypeEffective(
  ctx: ParsePayload<RegisteredNameTokens>,
) {
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
}

/**
 * Schema for {@link RegisteredNameTokens}.
 */
export const makeRegisteredNameTokenSchema = (valueLabel: string = "Registered Name Token") =>
  z
    .object({
      domainId: makeNodeSchema(`${valueLabel}.domainId`),
      name: makeReinterpretedNameSchema(valueLabel),
      tokens: z.array(makeNameTokenSchema(`${valueLabel}.tokens`)).nonempty(),
      expiresAt: makeUnixTimestampSchema(`${valueLabel}.expiresAt`),
      accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
    })
    .check(invariant_nameIsAssociatedWithDomainId)
    .check(invariant_nameTokensContainAtMostOneWithOwnershipTypeEffective)
    .check(invariant_nameTokensOwnershipTypeProxyRequiresOwnershipTypeFullyOnchainOrUnknown);

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
