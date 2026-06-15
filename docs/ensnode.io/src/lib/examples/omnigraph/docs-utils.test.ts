import { describe, expect, it } from "vitest";

import exampleSnapshots from "@data/omnigraph-examples/examples.json";
import type { SnapshotExample } from "@data/omnigraph-examples/types";

import { buildOmnigraphCurlExample } from "./docs-utils";

const examples = exampleSnapshots as SnapshotExample[];

describe("buildOmnigraphCurlExample", () => {
  it("strips # line comments before compacting the query", () => {
    const offchainName = examples.find((example) => example.id === "offchain-name");
    expect(offchainName).toBeDefined();

    const curl = buildOmnigraphCurlExample({
      connectionBaseUrl: "https://api.alpha.ensnode.io",
      query: `query SimpleQuery($name: InterpretedName!) {
        domain(by: { name: $name }) {
          # this is graphql variable defining type of object, very helpful!
          __typename
          id
          canonical { name { interpreted } }
          resolver {
            # the wildcard Resolver that ENS Forward Resolution (ENSIP-10) lands on
            effective { extended contract { chainId address } }
          }
          someRangdomThings(query: "# ## # some but this is # not a comment !")
        }
      }`,
      variables: { name: "hello-world.eth" },
    });

    const expected = `# POST JSON to your ENSNode Omnigraph endpoint (same path enssdk uses).
curl -sS -X POST "https://api.alpha.ensnode.io/api/omnigraph" \\
  -H "Content-Type: application/json" \\
  -d '{
  "query": "query SimpleQuery($name: InterpretedName!) { domain(by: { name: $name }) { __typename id canonical { name { interpreted } } resolver { effective { extended contract { chainId address } } } someRangdomThings(query: \\"# ## # some but this is # not a comment !\\") } }",
  "variables": {"name":"hello-world.eth"}
}'`;

    expect(curl).toBe(expected);
  });
});
