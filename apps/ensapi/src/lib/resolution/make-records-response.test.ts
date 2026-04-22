import { asInterpretedName, type CoinType, type Hex, type InterfaceId } from "enssdk";
import { describe, expect, it } from "vitest";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { makeRecordsResponse } from "./make-records-response";
import { makeOperations, type Operation } from "./operations";

describe("makeRecordsResponse", () => {
  const node = `0x${"00".repeat(32)}` as Hex;

  it("writes a resolved name record", () => {
    const operations = [
      { functionName: "name", args: [node], result: asInterpretedName("test.eth") },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({ name: "test.eth" });
  });

  it("writes resolved address records keyed by CoinType", () => {
    const operations = [
      { functionName: "addr", args: [node, 60n], result: "0x123" },
      { functionName: "addr", args: [node, 1001n], result: "0x456" },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      addresses: { 60: "0x123", 1001: "0x456" },
    });
  });

  it("writes resolved text records keyed by key", () => {
    const operations = [
      { functionName: "text", args: [node, "com.twitter"], result: "@test" },
      { functionName: "text", args: [node, "avatar"], result: "ipfs://..." },
    ] satisfies Operation[];
    expect(makeRecordsResponse(operations)).toEqual({
      texts: { "com.twitter": "@test", avatar: "ipfs://..." },
    });
  });

  it("writes resolved contenthash / pubkey / dnszonehash / version", () => {
    const operations = [
      { functionName: "contenthash", args: [node], result: "0xdeadbeef" as Hex },
      {
        functionName: "pubkey",
        args: [node],
        result: { x: `0x${"11".repeat(32)}` as Hex, y: `0x${"22".repeat(32)}` as Hex },
      },
      { functionName: "zonehash", args: [node], result: "0xcafe" as Hex },
      { functionName: "recordVersions", args: [node], result: 7n },
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
        args: [node, 1n],
        result: { contentType: 1n, data: "0xabcd" as Hex },
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
    const operations = makeOperations(node, selection);
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
