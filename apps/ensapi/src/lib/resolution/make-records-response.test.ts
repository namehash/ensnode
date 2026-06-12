import { asInterpretedName, type CoinType, type InterfaceId } from "enssdk";
import { describe, expect, it } from "vitest";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { makeRecordsResponse } from "./make-records-response";
import { makeOperations, type Operation } from "./operations";

const ZERO_NODE = `0x${"00".repeat(32)}` as const;

describe("makeRecordsResponse", () => {
  it("writes a resolved name record", () => {
    const operations = [
      { functionName: "name", args: [ZERO_NODE], result: asInterpretedName("test.eth") },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({ name: "test.eth" });
  });

  it("writes resolved address records keyed by CoinType", () => {
    const operations = [
      { functionName: "addr", args: [ZERO_NODE, 60n], result: "0x1234" },
      { functionName: "addr", args: [ZERO_NODE, 1001n], result: "0x5678" },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      addresses: { 60: "0x1234", 1001: "0x5678" },
    });
  });

  it("writes resolved text records keyed by key", () => {
    const operations = [
      { functionName: "text", args: [ZERO_NODE, "com.twitter"], result: "@test" },
      { functionName: "text", args: [ZERO_NODE, "avatar"], result: "ipfs://..." },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      texts: { "com.twitter": "@test", avatar: "ipfs://..." },
    });
  });

  it("writes resolved contenthash / pubkey / dnszonehash / version", () => {
    const operations = [
      { functionName: "contenthash", args: [ZERO_NODE], result: "0xdeadbeef" },
      {
        functionName: "pubkey",
        args: [ZERO_NODE],
        result: { x: `0x${"11".repeat(32)}`, y: `0x${"22".repeat(32)}` },
      },
      { functionName: "zonehash", args: [ZERO_NODE], result: "0xcafe" },
      { functionName: "recordVersions", args: [ZERO_NODE], result: 7n },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      contenthash: "0xdeadbeef",
      pubkey: { x: `0x${"11".repeat(32)}`, y: `0x${"22".repeat(32)}` },
      dnszonehash: "0xcafe",
      version: 7n,
    });
  });

  it("writes a resolved ABI", () => {
    const operations = [
      {
        functionName: "ABI",
        args: [ZERO_NODE, 1n],
        result: { contentType: 1n, data: "0xabcd" },
      },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      abi: { contentType: 1n, data: "0xabcd" },
    });
  });

  it("materializes unresolved operations as 'no record' defaults", () => {
    const id = "0x01020304" as InterfaceId;
    const selection: ResolverRecordsSelection = {
      name: true,
      addresses: [60 as CoinType],
      texts: ["avatar"],
      contenthash: true,
      pubkey: true,
      dnszonehash: true,
      version: true,
      abi: 1n,
      interfaces: [id],
    };
    // operations generated from selection, every entry unresolved
    const operations = makeOperations(ZERO_NODE, selection);
    expect(makeRecordsResponse(operations)).toEqual({
      name: null,
      addresses: { 60: null },
      texts: { avatar: null },
      contenthash: null,
      pubkey: null,
      dnszonehash: null,
      version: null,
      abi: null,
      interfaces: { [id]: null },
    });
  });

  it("returns {} for an empty selection + empty operations", () => {
    expect(makeRecordsResponse([])).toEqual({});
  });
});
