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

function invariant_everyNameTokenIsAssociatedWithDomainId(ctx: ParsePayload<RegisteredNameTokens>) {
  const { domainId, tokens } = ctx.value;

  if (!tokens.every((t) => t.domainAsset.domainId === domainId)) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Every name token in 'tokens' must be associated with 'domainId': ${domainId}`,
    });
  }
}

function invariant_nameTokensOwnershipTypeProxyRequiresOwnershipTypeEffective(
  ctx: ParsePayload<RegisteredNameTokens>,
) {
  const { tokens } = ctx.value;
  const containsOwnershipProxy = tokens.some(
    (t) => t.ownership.ownershipType === NameTokenOwnershipTypes.Proxy,
  );
  const containsOwnershipEffective = tokens.some(
    (t) => t.ownership.ownershipType === NameTokenOwnershipTypes.Effective,
  );
  if (containsOwnershipProxy && !containsOwnershipEffective) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'tokens' must contain name token with ownership type 'effective' when name token with ownership type 'proxy' in listed`,
    });
  }
}

function invariant_nameTokensContainAtMostOneWithOwnershipTypeEffective(
  ctx: ParsePayload<RegisteredNameTokens>,
) {
  const { tokens } = ctx.value;
  const tokensCountWithOwnershipEffective = tokens.filter(
    (t) => t.ownership.ownershipType === NameTokenOwnershipTypes.Effective,
  ).length;
  if (tokensCountWithOwnershipEffective > 1) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'tokens' must contain at most one name token with ownership type 'effective', current count: ${tokensCountWithOwnershipEffective}`,
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
    .check(invariant_everyNameTokenIsAssociatedWithDomainId)
    .check(invariant_nameTokensContainAtMostOneWithOwnershipTypeEffective)
    .check(invariant_nameTokensOwnershipTypeProxyRequiresOwnershipTypeEffective);

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
