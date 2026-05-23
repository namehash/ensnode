import { buildSchema, parse, validate } from "graphql";
import { describe, expect, it } from "vitest";

import { ACTIVE_OMNIGRAPH_VERSION } from "./active";
import type { SnapshotExample } from "./types";

const schemas = import.meta.glob<string>("./versions/*/schema.graphql", {
  query: "?raw",
  import: "default",
  eager: true,
});
const examples = import.meta.glob<SnapshotExample[]>("./versions/*/examples.json", {
  import: "default",
  eager: true,
});

describe("Omnigraph version snapshots", () => {
  it("has at least one version snapshot", () => {
    expect(Object.keys(schemas).length).toBeGreaterThan(0);
  });

  it("ACTIVE_OMNIGRAPH_VERSION has a committed snapshot", () => {
    expect(schemas[`./versions/${ACTIVE_OMNIGRAPH_VERSION}/schema.graphql`]).toBeDefined();
    expect(examples[`./versions/${ACTIVE_OMNIGRAPH_VERSION}/examples.json`]).toBeDefined();
  });

  for (const schemaPath of Object.keys(schemas)) {
    const version = schemaPath.match(/versions\/([^/]+)\//)?.[1] ?? schemaPath;
    const examplesPath = schemaPath.replace("schema.graphql", "examples.json");
    const versionExamples = examples[examplesPath];

    describe(version, () => {
      const schema = buildSchema(schemas[schemaPath]);

      it("has an examples snapshot", () => {
        expect(versionExamples).toBeDefined();
      });

      it.each((versionExamples ?? []).map((e) => [e.id, e.query] as const))(
        "%s validates against the snapshot schema",
        (_id, query) => {
          expect(validate(schema, parse(query))).toHaveLength(0);
        },
      );
    });
  }
});
