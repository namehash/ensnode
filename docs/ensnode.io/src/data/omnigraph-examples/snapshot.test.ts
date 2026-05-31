import { buildSchema, parse, validate } from "graphql";
import { describe, expect, it } from "vitest";

import exampleSnapshots from "./examples.json";
import schemaSdl from "./schema.graphql?raw";
import type { SnapshotExample } from "./types";

const examples = exampleSnapshots as SnapshotExample[];

describe("Omnigraph snapshot", () => {
  const schema = buildSchema(schemaSdl);

  it("has a non-empty examples snapshot", () => {
    expect(examples.length).toBeGreaterThan(0);
  });

  it.each(examples.map((e) => [e.id, e.query] as const))(
    "%s validates against the snapshot schema",
    (_id, query) => {
      expect(validate(schema, parse(query))).toHaveLength(0);
    },
  );
});
