import { describe, it, expect } from "vitest";
import { client } from "@/test/integration/resolution-api-client";

const OWNER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

describe("GET /api/resolve/records/:name", () => {
  it.each([
    {
      description: "resolves ETH address (coin 60) for test.eth",
      input: { name: "test.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "resolves ETH address for newowner.eth (coin 60 stays as original registrant after token transfer)",
      input: { name: "newowner.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves description text record for example.eth",
      input: { name: "example.eth", selection: { texts: ["description"] } },
      expected: {
        records: { texts: { description: "example.eth" } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves description text record for alias.eth (resolves via alias to test.eth)",
      input: { name: "alias.eth", selection: { texts: ["description"] } },
      expected: {
        records: { texts: { description: "test.eth" } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves both address and text records for example.eth",
      input: { name: "example.eth", selection: { addresses: [60], texts: ["description"] } },
      expected: {
        records: {
          addresses: { 60: OWNER },
          texts: { description: "example.eth" },
        },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns null address for reserved.eth (no resolver)",
      input: { name: "reserved.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: null } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "returns old coin 60 record for sub.unregistered.eth (token burned but resolver records persist)",
      input: { name: "sub.unregistered.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns null address for nonexistent name",
      input: { name: "thisnamedoesnotexist.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: null } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves ETH address for linked.parent.eth (alias to sub1.sub2.parent.eth)",
      input: { name: "linked.parent.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "resolves ETH address for wallet.linked.parent.eth (alias to wallet.sub1.sub2.parent.eth)",
      input: { name: "wallet.linked.parent.eth", selection: { addresses: [60] } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "test.eth with accelerate=true returns accelerationRequested: true",
      input: { name: "test.eth", selection: { addresses: [60] }, options: { accelerate: true } },
      expected: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: true,
      },
    },
  ])("$description", async ({ input, expected }) => {
    const result = await client.resolveRecords(input.name, input.selection, input.options);
    expect(result).toMatchObject(expected);
  });
});
