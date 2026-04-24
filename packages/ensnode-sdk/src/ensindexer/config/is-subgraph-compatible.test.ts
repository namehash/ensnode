import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { isSubgraphCompatible } from "./is-subgraph-compatible";
import { PluginName } from "./types";

describe("isSubgraphCompatible", () => {
  const subgraphCompatibleClientLabelSet = {
    labelSetId: "subgraph" as const,
    labelSetVersion: 0,
  };

  it(`returns 'true' when only the '${PluginName.Subgraph}' plugin is active, no extended indexing features are on, and label set is subgraph/0`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph],
        clientLabelSet: subgraphCompatibleClientLabelSet,
      }),
    ).toBe(true);
  });

  it(`returns 'false' when active plugins are something else than just '${PluginName.Subgraph}'`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [],
        clientLabelSet: subgraphCompatibleClientLabelSet,
      }),
    ).toBe(false);

    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph, PluginName.Lineanames],
        clientLabelSet: subgraphCompatibleClientLabelSet,
      }),
    ).toBe(false);
  });

  it(`returns 'false' when label set id is not 'subgraph'`, () => {
    expect(
      isSubgraphCompatible({
        namespace: ENSNamespaceIds.Mainnet,
        plugins: [PluginName.Subgraph],
        clientLabelSet: {
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
        clientLabelSet: {
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
        clientLabelSet: {
          labelSetId: "ens-test-env",
          labelSetVersion: 0,
        },
      }),
    ).toBe(true);
  });
});
