import { describe, expect, it } from "vitest";

import { errorResponseBadRequestExample } from "./examples";
import { ErrorResponseSchema } from "./zod-schemas";

describe("ErrorResponseSchema", () => {
  it("errorResponseBadRequestExample passes schema", () => {
    expect(ErrorResponseSchema.safeParse(errorResponseBadRequestExample).success).toBe(true);
  });
});
