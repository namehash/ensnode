import { namehash } from "viem";
import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeRealtimeIndexingStatusProjectionSchema } from "../ensindexer/indexing-status/zod-schemas";
import { makeReinterpretedNameSchema } from "../shared/zod-schemas";
import { makeRegistrarActionSchema } from "../registrars/zod-schemas";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  type NamedRegistrarAction,
  RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  RegistrarActionsResponseError,
  RegistrarActionsResponseOk,
} from "./types";

export const ErrorResponseSchema = z.object({
  message: z.string(),
  details: z.optional(z.unknown()),
});

// Indexing Status API

/**
 * Schema for {@link IndexingStatusResponseOk}
 **/
export const makeIndexingStatusResponseOkSchema = (
  valueLabel: string = "Indexing Status Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(IndexingStatusResponseCodes.Ok),
    realtimeProjection: makeRealtimeIndexingStatusProjectionSchema(valueLabel),
  });

/**
 * Schema for {@link IndexingStatusResponseError}
 **/
export const makeIndexingStatusResponseErrorSchema = (
  _valueLabel: string = "Indexing Status Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(IndexingStatusResponseCodes.Error),
  });

/**
 * Schema for {@link IndexingStatusResponse}
 **/
export const makeIndexingStatusResponseSchema = (valueLabel: string = "Indexing Status Response") =>
  z.discriminatedUnion("responseCode", [
    makeIndexingStatusResponseOkSchema(valueLabel),
    makeIndexingStatusResponseErrorSchema(valueLabel),
  ]);

// Registrar Action API

function invariant_registrationLifecycleNodeMatchesName(ctx: ParsePayload<NamedRegistrarAction>) {
  const { name, action } = ctx.value;
  const expectedNode = action.registrationLifecycle.node;
  const actualNode = namehash(name);

  if (actualNode !== expectedNode) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `The 'action.registrationLifecycle.node' must match namehash of 'name'`,
    });
  }
}

/**
 * Schema for {@link NamedRegistrarAction}.
 */
export const makeNamedRegistrarActionSchema = (valueLabel: string = "Named Registrar Action") =>
  z
    .object({
      action: makeRegistrarActionSchema(valueLabel),
      name: makeReinterpretedNameSchema(valueLabel),
    })
    .check(invariant_registrationLifecycleNodeMatchesName);

/**
 * Schema for {@link RegistrarActionsResponseOk}
 **/
export const makeRegistrarActionsResponseOkSchema = (
  valueLabel: string = "Registrar Actions Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Ok),
    registrarActions: z.array(makeNamedRegistrarActionSchema(valueLabel)),
  });

/**
 * Schema for {@link RegistrarActionsResponseError}
 **/
export const makeRegistrarActionsResponseErrorSchema = (
  _valueLabel: string = "Registrar Actions Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Error),
    error: ErrorResponseSchema,
  });

/**
 * Schema for {@link RegistrarActionsResponse}
 **/
export const makeRegistrarActionsResponseSchema = (
  valueLabel: string = "Registrar Actions Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeRegistrarActionsResponseOkSchema(valueLabel),
    makeRegistrarActionsResponseErrorSchema(valueLabel),
  ]);
