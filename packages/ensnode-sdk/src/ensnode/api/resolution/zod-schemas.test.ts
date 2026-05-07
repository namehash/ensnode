import { describe, expect, it } from "vitest";

import {
  resolvePrimaryNameResponseExample,
  resolvePrimaryNamesResponseExample,
  resolveRecordsResponseExample,
} from "./examples";
import {
  makeResolvePrimaryNameResponseSchema,
  makeResolvePrimaryNamesResponseSchema,
  makeResolveRecordsResponseSchema,
} from "./zod-schemas";

describe("Resolution: Zod Schemas", () => {
  it("resolveRecordsResponseExample passes schema", () => {
    expect(
      makeResolveRecordsResponseSchema().safeParse(resolveRecordsResponseExample).success,
    ).toBe(true);
  });

  it("resolvePrimaryNameResponseExample passes schema", () => {
    expect(
      makeResolvePrimaryNameResponseSchema().safeParse(resolvePrimaryNameResponseExample).success,
    ).toBe(true);
  });

  it("resolvePrimaryNamesResponseExample passes schema", () => {
    expect(
      makeResolvePrimaryNamesResponseSchema().safeParse(resolvePrimaryNamesResponseExample).success,
    ).toBe(true);
  });
});
