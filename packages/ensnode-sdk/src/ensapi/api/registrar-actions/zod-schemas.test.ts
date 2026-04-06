import { describe, expect, it } from "vitest";

import { registrarActionsResponseOkExample } from "./examples";
import { RegistrarActionsResponseCodes, type RegistrarActionsResponseError } from "./response";
import type { SerializedRegistrarActionsResponseError } from "./serialized-response";
import {
  makeRegistrarActionsResponseSchema,
  makeSerializedRegistrarActionsResponseSchema,
} from "./zod-schemas";

describe("ENSNode API Schema", () => {
  describe("Registrar Actions API", () => {
    const validResponseError = {
      responseCode: RegistrarActionsResponseCodes.Error,
      error: { message: "any message", details: "any details" },
    } satisfies SerializedRegistrarActionsResponseError;

    it("registrarActionsResponseOkExample passes schema", () => {
      expect(
        makeSerializedRegistrarActionsResponseSchema().safeParse(registrarActionsResponseOkExample)
          .success,
      ).toBe(true);
    });

    it("can deserialize ResponseOk object via domain schema", () => {
      const serialized = makeSerializedRegistrarActionsResponseSchema().parse(
        registrarActionsResponseOkExample,
      );
      expect(() => makeRegistrarActionsResponseSchema().parse(serialized)).not.toThrowError();
    });

    it("can parse valid ResponseError object", () => {
      const parsed = makeRegistrarActionsResponseSchema().parse(validResponseError);

      expect(parsed).toStrictEqual({
        responseCode: RegistrarActionsResponseCodes.Error,
        error: validResponseError.error,
      } satisfies RegistrarActionsResponseError);
    });
  });
});
