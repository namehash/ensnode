import { namehashInterpretedName } from "enssdk";
import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeRegistrarActionSchema,
  makeSerializedRegistrarActionSchema,
} from "../../../registrars/zod-schemas";
import { makeReinterpretedNameSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import { makeErrorResponseSchema } from "../shared/errors/zod-schemas";
import { makeResponsePageContextSchema } from "../shared/pagination/zod-schemas";
import { type NamedRegistrarAction, RegistrarActionsResponseCodes } from "./response";
import {
  SerializedNamedRegistrarAction,
  SerializedRegistrarActionsResponseOk,
} from "./serialized-response";

function invariant_registrationLifecycleNodeMatchesName(ctx: ParsePayload<NamedRegistrarAction>) {
  const { name, action } = ctx.value;
  const expectedNode = action.registrationLifecycle.node;
  const actualNode = namehashInterpretedName(name);

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
const makeSerializedNamedRegistrarActionSchema = (
  valueLabel: string = "Serialized Named Registrar Action",
) =>
  z.object({
    action: makeSerializedRegistrarActionSchema(valueLabel),
    name: makeReinterpretedNameSchema(valueLabel),
  });

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
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });

/**
 * Schema for {@link RegistrarActionsResponseError}
 */
export const makeRegistrarActionsResponseErrorSchema = (
  _valueLabel: string = "Registrar Actions Response Error",
) =>
  z.strictObject({
    responseCode: z.literal(RegistrarActionsResponseCodes.Error),
    error: makeErrorResponseSchema(),
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
 * Schema for {@link SerializedRegistrarActionsResponseOk}
 */
export const makeSerializedRegistrarActionsResponseOkSchema = (
  valueLabel: string = "Serialized Registrar Actions Response OK",
) =>
  z.object({
    responseCode: z.literal(RegistrarActionsResponseCodes.Ok),
    registrarActions: z.array(makeSerializedNamedRegistrarActionSchema(valueLabel)),
    pageContext: makeResponsePageContextSchema(`${valueLabel}.pageContext`),
    accurateAsOf: makeUnixTimestampSchema(`${valueLabel}.accurateAsOf`),
  });
