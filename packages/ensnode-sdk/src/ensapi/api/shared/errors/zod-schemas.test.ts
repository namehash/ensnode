import { describe, expect, it } from "vitest";

import { errorResponseBadRequestExample } from "./examples";
import { makeErrorResponseSchema } from "./zod-schemas";

describe("makeErrorResponseSchema", () => {
  it("errorResponseBadRequestExample passes schema", () => {
    expect(makeErrorResponseSchema().safeParse(errorResponseBadRequestExample).success).toBe(true);
  });
});
