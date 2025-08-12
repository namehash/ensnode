import { describe, expect, it } from "vitest";

import { zeroAddress } from "viem";
import { ZodError } from "zod/v4";
import { routes } from "./zod-schemas";

describe("routes.records", () => {
  it("parses valid params", () => {
    expect(routes.records.params.parse({ name: "vitalik.eth" })).toEqual({
      name: "vitalik.eth",
    });

    expect(routes.records.params.parse({ name: "🔥🔥🔥🔥🔥.eth" })).toEqual({
      name: "🔥🔥🔥🔥🔥.eth",
    });
  });

  it("requires selection", () => {
    expect(() => routes.records.query.parse({})).toThrow(ZodError);
  });

  it("requires normalized name", () => {
    expect(() => routes.records.params.parse({ name: "Vitalik.eth" })).toThrow(ZodError);
  });

  it("parses query with defaults", () => {
    expect(
      routes.records.query.parse({
        name: "true",
        addresses: "60,0",
        texts: "example,hello",
      }),
    ).toEqual({
      selection: {
        name: true,
        addresses: [60, 0],
        texts: ["example", "hello"],
      },
      trace: false,
      accelerate: true,
    });
  });

  it("allows overriding of defaults", () => {
    expect(
      routes.records.query.parse({ name: "true", trace: "true", accelerate: "false" }),
    ).toEqual({
      selection: { name: true },
      trace: true,
      accelerate: false,
    });
  });
});

describe("routes.primaryName", () => {
  it("parses valid params", () => {
    expect(routes.primaryName.params.parse({ address: zeroAddress, chainId: "1" })).toEqual({
      address: zeroAddress,
      chainId: 1,
    });
  });

  it("requires valid address", () => {
    expect(() => routes.primaryName.params.parse({ address: "0xabcd", chainId: "1" })).toThrow(
      ZodError,
    );
  });

  it("requires valid chainId", () => {
    expect(() => routes.primaryName.params.parse({ address: zeroAddress, chainId: "-1" })).toThrow(
      ZodError,
    );
  });

  it("parses query with defaults", () => {
    expect(routes.primaryName.query.parse({})).toEqual({
      trace: false,
      accelerate: true,
    });
  });

  it("allows overriding of defaults", () => {
    expect(routes.primaryName.query.parse({ trace: "true", accelerate: "false" })).toEqual({
      trace: true,
      accelerate: false,
    });
  });
});

describe("routes.primaryNames", () => {
  it("parses valid params", () => {
    expect(routes.primaryNames.params.parse({ address: zeroAddress })).toEqual({
      address: zeroAddress,
    });
  });

  it("parses valid query", () => {
    expect(routes.primaryNames.query.parse({ chainIds: "1,10,8453" })).toEqual({
      chainIds: [1, 10, 8453],
      trace: false,
      accelerate: true,
    });
  });

  it("defaults trace and accelerate", () => {
    const parsed = routes.primaryNames.query.parse({});
    expect(parsed.trace).toBe(false);
    expect(parsed.accelerate).toBe(true);
  });

  it("rejects default EVM chain id in chainIds", () => {
    expect(() => routes.primaryNames.query.parse({ chainIds: "0,1" })).toThrow(ZodError);
  });
});
