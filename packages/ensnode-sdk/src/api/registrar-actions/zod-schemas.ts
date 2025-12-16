import { namehash } from "viem/ens";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeRegistrarActionSchema } from "../../registrars/zod-schemas";
import { makeReinterpretedNameSchema } from "../../shared/zod-schemas";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import { makeResponsePageContextSchema } from "../shared/pagination/zod-schemas";
import { type NamedRegistrarAction, RegistrarActionsResponseCodes } from "./response";

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
 */
export const makeRegistrarActionsResponseOkSchema = (
  valueLabel: string = "Registrar Actions Response OK",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Ok),
    registrarActions: z.array(makeNamedRegistrarActionSchema(valueLabel)),
    pageContext: makeResponsePageContextSchema(`${valueLabel}.pageContext`),
  });

/**
 * Schema for {@link RegistrarActionsResponseError}
 */
export const makeRegistrarActionsResponseErrorSchema = (
  _valueLabel: string = "Registrar Actions Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Error),
    error: ErrorResponseSchema,
  });

/**
 * Schema for {@link RegistrarActionsResponse}
 */
export const makeRegistrarActionsResponseSchema = (
  valueLabel: string = "Registrar Actions Response",
) =>
  z.discriminatedUnion("responseCode", [
    makeRegistrarActionsResponseOkSchema(valueLabel),
    makeRegistrarActionsResponseErrorSchema(valueLabel),
  ]);

// Resolution API

/**
 * Schema for resolver records response (addresses, texts, name)
 */
const makeResolverRecordsResponseSchema = () =>
  z.object({
    name: z.string().nullable().optional(),
    addresses: z.record(z.string(), z.string().nullable()).optional(),
    texts: z.record(z.string(), z.string().nullable()).optional(),
  });

/**
 * Schema for {@link ResolveRecordsResponse}
 */
export const makeResolveRecordsResponseSchema = () =>
  z.object({
    records: makeResolverRecordsResponseSchema(),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.any().optional(),
  });

/**
 * Schema for {@link ResolvePrimaryNameResponse}
 */
export const makeResolvePrimaryNameResponseSchema = () =>
  z.object({
    name: z.string().nullable(),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.any().optional(),
  });

/**
 * Schema for {@link ResolvePrimaryNamesResponse}
 */
export const makeResolvePrimaryNamesResponseSchema = () =>
  z.object({
    names: z.record(z.number(), z.string().nullable()),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.any().optional(),
  });
