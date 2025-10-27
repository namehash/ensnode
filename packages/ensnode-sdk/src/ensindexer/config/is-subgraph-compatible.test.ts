import { ENSNamespaceIds } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";
import { isSubgraphCompatible } from "./is-subgraph-compatible";
import { PluginName } from "./types";

describe("isSubgraphCompatible", () => {
  const subgraphCompatibleLabelSet = {
    labelSetId: "subgraph" as const,
    labelSetVersion: 0,
  };

  it(`returns 'true' when only the '${PluginName.Subgraph}' plugin is active, no extended indexing features are on, and label set is subgraph/0`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph],
        labelSet: subgraphCompatibleLabelSet,
      }),
    ).toBe(true);
  });

  it(`returns 'false' when active plugins are something else than just '${PluginName.Subgraph}'`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [],
        labelSet: subgraphCompatibleLabelSet,
      }),
    ).toBe(false);

    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph, PluginName.Lineanames],
        labelSet: subgraphCompatibleLabelSet,
      }),
    ).toBe(false);
  });

  it(`returns 'false' when label set id is not 'subgraph'`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph],
        labelSet: {
          labelSetId: "other-label-set",
          labelSetVersion: 0,
        },
      }),
    ).toBe(false);
  });

  it(`returns 'false' when label set version is not 0`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph],
        labelSet: {
          labelSetId: "subgraph",
          labelSetVersion: 1,
        },
      }),
    ).toBe(false);
  });

  it(`returns 'true' when ens-test-env`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.EnsTestEnv,
        plugins: [PluginName.Subgraph],
        labelSet: {
          labelSetId: "ens-test-env",
          labelSetVersion: 0,
        },
      }),
    ).toBe(true);
  });
});
