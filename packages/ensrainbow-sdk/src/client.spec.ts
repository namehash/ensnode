import { beforeEach, describe, expect, it } from "vitest";
import { EnsRainbowApiClient } from "./client";
import { DEFAULT_ENSRAINBOW_URL } from "./consts";
import type { HealError, HealSuccess } from "./types";

describe("EnsRainbowApiClient", () => {
  let client: EnsRainbowApiClient;

  beforeEach(() => {
    client = new EnsRainbowApiClient({
      endpointUrl: new URL(DEFAULT_ENSRAINBOW_URL),
    });
  });

  it("should heal a known labelhash", async () => {
    const response = await client.heal(
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
    );

    expect(response).toEqual({
      status: "success",
      label: "vitalik",
    } satisfies HealSuccess);
  });

  it("should return an error for an unknown labelhash", async () => {
    const response = await client.heal(
      "0xf64dc17ae2e2b9b16dbcb8cb05f35a2e6080a5ff1dc53ac0bc48f0e79111f264",
    );

    expect(response).toEqual({
      status: "error",
      error: "Label not found",
      errorCode: 404,
    } satisfies HealError);
  });

  it("should return an error for an invalid labelhash", async () => {
    const response = await client.heal("0xinvalid");

    expect(response).toEqual({
      status: "error",
      error: "Invalid labelhash length 9 characters (expected 66)",
      errorCode: 400,
    } satisfies HealError);
  });
});
