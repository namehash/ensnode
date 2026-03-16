import { parse } from "graphql";
import { describe, expect, it } from "vitest";

import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

describe("Example Queries", () => {
  it.each(
    GRAPHQL_API_EXAMPLE_QUERIES.map((entry, i) => ({
      name: `Query #${i}`,
      query: entry.query,
    })),
  )("$name parses as valid GraphQL", ({ query }) => {
    expect(() => parse(query)).not.toThrow();
  });
});
