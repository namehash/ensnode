import { labelhash, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod/v4";

import { DEFAULT_EVM_CHAIN_ID } from "@ensnode/ensnode-sdk";

import { params } from "./params.schema";

describe("params.name", () => {
  it("parses valid params", () => {
    expect(params.name.parse("vitalik.eth")).toEqual("vitalik.eth");
    expect(params.name.parse("🔥🔥🔥🔥🔥.eth")).toEqual("🔥🔥🔥🔥🔥.eth");

    const nameWithLongLabel = `${new Array(256).join("🔥")}.eth`;
    expect(params.name.parse(nameWithLongLabel)).toEqual(nameWithLongLabel);
  });

  it("requires normalized name", () => {
    expect(() => params.name.parse("Vitalik.eth")).toThrow(ZodError);
    expect(() => params.name.parse("unnormalizable|name.eth")).toThrow(ZodError);
    expect(() => params.name.parse(`[${labelhash("vitalik")}].eth`)).toThrow(ZodError);
  });
});

describe("params.selection", () => {
  it("parses selection", () => {
    expect(
      params.selection.parse({
        name: "true",
        addresses: "60,0",
        texts: "example,hello",
      }),
    ).toEqual({
      name: true,
      addresses: [60, 0],
      texts: ["example", "hello"],
    });
  });

  it("requires selection", () => {
    expect(() => params.selection.parse({})).toThrow(ZodError);
  });
});

describe("params.trace", () => {
  it("allows overriding of defaults", () => {
    expect(params.trace.parse(undefined)).toEqual(false);
    expect(params.trace.parse("true")).toEqual(true);
    expect(params.trace.parse("false")).toEqual(false);

    expect(() => params.trace.parse("")).toThrow(ZodError);
  });
});

describe("params.accelerate", () => {
  it("allows overiding of defaults", () => {
    expect(params.accelerate.parse(undefined)).toEqual(false);
    expect(params.accelerate.parse("true")).toEqual(true);
    expect(params.accelerate.parse("false")).toEqual(false);

    expect(() => params.accelerate.parse("")).toThrow(ZodError);
  });
});

describe("params.address", () => {
  it("parses valid address", () => {
    expect(params.address.parse(zeroAddress)).toEqual(zeroAddress);
  });

  it("throws for invalid address", () => {
    expect(() => params.address.parse("0xabcd")).toThrow(ZodError);
  });

  it("requires address", () => {
    expect(() => params.address.parse(undefined)).toThrow(ZodError);
    expect(() => params.address.parse("")).toThrow(ZodError);
  });
});

describe("params.defaultableChainId", () => {
  it("parses valid chain id", () => {
    expect(params.defaultableChainId.parse("1")).toEqual(1);
  });

  it("allows default evm chain id", () => {
    expect(params.defaultableChainId.parse(DEFAULT_EVM_CHAIN_ID.toString())).toEqual(
      DEFAULT_EVM_CHAIN_ID,
    );
  });

  it("requires valid chainId", () => {
    expect(() => params.defaultableChainId.parse("-1")).toThrow(ZodError);
  });
});

describe("params.chainIdsWithoutDefaultChainId", () => {
  it("parses valid chain ids", () => {
    expect(params.chainIdsWithoutDefaultChainId.parse("1,10,8453")).toEqual([1, 10, 8453]);
  });

  it("rejects duplicate chain ids", () => {
    expect(() => params.chainIdsWithoutDefaultChainId.parse("1,1")).toThrow(ZodError);
  });

  it("rejects default EVM chain id in chainIds", () => {
    expect(() => params.chainIdsWithoutDefaultChainId.parse("0,1")).toThrow(ZodError);
  });
});
