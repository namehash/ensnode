import { describe, expect, it } from "vitest";

import { validResponseError, validResponseOk } from "./mocks";
import { RegistrarActionsResponseCodes, type RegistrarActionsResponseError } from "./response";
import { makeRegistrarActionsResponseSchema } from "./zod-schemas";

describe("ENSNode API Schema", () => {
  describe("Registrar Actions API", () => {
    it("can parse valid ResponseOk object", () => {
      expect(() => makeRegistrarActionsResponseSchema().parse(validResponseOk)).not.toThrowError();
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
