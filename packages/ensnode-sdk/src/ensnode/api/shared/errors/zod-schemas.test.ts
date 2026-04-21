import { describe, expect, it } from "vitest";

import {
  errorResponseBadRequestExample,
  errorResponseInternalServerErrorExample,
  errorResponseInvalidAddressExample,
  errorResponseInvalidNameExample,
} from "./examples";
import { makeErrorResponseSchema } from "./zod-schemas";

describe("makeErrorResponseSchema", () => {
  it.each([
    ["errorResponseBadRequestExample", errorResponseBadRequestExample],
    ["errorResponseInvalidNameExample", errorResponseInvalidNameExample],
    ["errorResponseInvalidAddressExample", errorResponseInvalidAddressExample],
    ["errorResponseInternalServerErrorExample", errorResponseInternalServerErrorExample],
  ])("%s passes schema", (_name, example) => {
    expect(makeErrorResponseSchema().safeParse(example).success).toBe(true);
  });
});
