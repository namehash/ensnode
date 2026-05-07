import type { Address } from "viem";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createEnsNodeClient } from "../core";
import type { DomainId, InterpretedName } from "../lib/types";
import { graphql } from "./graphql";
import { omnigraph } from "./module";

const client = createEnsNodeClient({ url: process.env.ENSNODE_URL! }).extend(omnigraph);

// hover over this query to see typechecking in action!
const HelloWorldQuery = graphql(`
  query HelloWorld {
    domain(by: { name: "eth" }) {
      id
      name
      owner { address }
    }
  }
`);

describe("omnigraph module (integration)", () => {
  it("executes HelloWorld query", async () => {
    const result = await client.omnigraph.query({ query: HelloWorldQuery });

    expect(result.errors).toBeUndefined();

    // look, our semantic types!
    expectTypeOf(result.data!.domain!.id).toEqualTypeOf<DomainId>();
    expectTypeOf(result.data!.domain!.name).toEqualTypeOf<InterpretedName | null>();
    expectTypeOf(result.data!.domain!.owner!.address).toEqualTypeOf<Address>();

    // the 'eth' domain should exist
    expect(result.data!.domain).toMatchObject({
      id: expect.any(String),
      name: "eth",
      owner: { address: expect.any(String) },
    });
  });
});
