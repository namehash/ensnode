import z from "zod/v4";

import { makeRealtimeIndexingStatusProjectionSchema } from "../ensindexer/indexing-status/zod-schemas";
import { RegistrarActionTypes } from "../registrars";
import {
  makeBaseRegistrarActionSchema,
  makeRegistrationLifecycleDomainSchema,
  makeRegistrationLifecycleSchema,
} from "../registrars/zod-schemas";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  RegistrarActionsResponseError,
  RegistrarActionsResponseOk,
  RegistrarActionWithDomain,
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

export const makeRegistrationLifecycleWithDomainSchema = (
  valueLabel: string = "Registration Lifecycle with Domain",
) =>
  makeRegistrationLifecycleSchema(valueLabel).extend({
    domain: makeRegistrationLifecycleDomainSchema(),
  });

export const makeRegistrarActionWithDomainRegistrationSchema = (
  valueLabel: string = "Registration",
) =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Registration),

    registrationLifecycle: makeRegistrationLifecycleWithDomainSchema(valueLabel),
  });

export const makeRegistrarActionWithDomainRenewalSchema = (valueLabel: string = "Renewal") =>
  makeBaseRegistrarActionSchema(valueLabel).extend({
    type: z.literal(RegistrarActionTypes.Renewal),

    registrationLifecycle: makeRegistrationLifecycleWithDomainSchema(valueLabel),
  });

/**
 * Schema for {@link RegistrarActionWithDomain}.
 */
export const makeRegistrarActionWithDomainSchema = (
  valueLabel: string = "Registrar Action with Domain",
) =>
  z.discriminatedUnion("type", [
    makeRegistrarActionWithDomainRegistrationSchema(`${valueLabel} Registration`),
    makeRegistrarActionWithDomainRenewalSchema(`${valueLabel} Renewal`),
  ]);

/**
 * Schema for {@link RegistrarActionsResponseOk}
 **/
export const makeRegistrarActionsResponseOkSchema = (
  valueLabel: string = "Registrar Actions Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Ok),
    registrarActions: z.array(makeRegistrarActionWithDomainSchema(valueLabel)),
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
