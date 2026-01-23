import { namehash } from "viem/ens";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeRegistrarActionSchema,
  makeSerializedRegistrarActionSchema,
} from "../../registrars/zod-schemas";
import { makeAbstractResultOkTimestampedSchema } from "../../shared/result/zod-schemas";
import { makeReinterpretedNameSchema, makeUnixTimestampSchema } from "../../shared/zod-schemas";
import { ErrorResponseSchema } from "../shared/errors/zod-schemas";
import { makeResponsePageContextSchema } from "../shared/pagination/zod-schemas";
import { type NamedRegistrarAction, RegistrarActionsResponseCodes } from "./response";
import type {
  RegistrarActionsResultOk,
  RegistrarActionsResultOkData,
  SerializedRegistrarActionsResultOk,
  SerializedRegistrarActionsResultOkData,
} from "./result";
import type { SerializedNamedRegistrarAction } from "./serialized-response";

function invariant_registrationLifecycleNodeMatchesName(
  ctx: ParsePayload<NamedRegistrarAction | SerializedNamedRegistrarAction>,
) {
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
 * Schema for {@link SerializedNamedRegistrarAction}.
 */
export const makeSerializedNamedRegistrarActionSchema = (
  valueLabel: string = "Serialized Named Registrar Action",
) =>
  z
    .object({
      action: makeSerializedRegistrarActionSchema(valueLabel).meta({
        description: `"Logical registrar action".`,
      }),
      name: makeReinterpretedNameSchema(valueLabel).meta({
        description: `FQDN of the name associated with 'action'.`,
      }),
    })
    .meta({
      description: `"Logical registrar action" with its associated name.`,
    })
    .check(invariant_registrationLifecycleNodeMatchesName);

/**
 * Schema for {@link RegistrarActionsResponseOk}
 */
export const makeRegistrarActionsResponseOkSchema = (
  valueLabel: string = "Registrar Actions Response OK",
) =>
  z.object({
    responseCode: z.literal(RegistrarActionsResponseCodes.Ok),
    registrarActions: z.array(makeNamedRegistrarActionSchema(valueLabel)),
    pageContext: makeResponsePageContextSchema(`${valueLabel}.pageContext`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`).optional(),
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

/**
 * Schema for {@link RegistrarActionsResultOk}
 */
export const makeRegistrarActionsResultOkSchema = () =>
  makeAbstractResultOkTimestampedSchema<RegistrarActionsResultOkData>(
    z.object({
      registrarActions: z.array(makeNamedRegistrarActionSchema("registrarActions")),
      pageContext: makeResponsePageContextSchema("pageContext"),
    }),
  );

/**
 * Schema for {@link SerializedRegistrarActionsResultOk}
 */
export const makeSerializedRegistrarActionsResultOkSchema = () =>
  makeAbstractResultOkTimestampedSchema<SerializedRegistrarActionsResultOkData>(
    z.object({
      registrarActions: z.array(makeSerializedNamedRegistrarActionSchema("registrarActions")),
      pageContext: makeResponsePageContextSchema("pageContext"),
    }),
  );
