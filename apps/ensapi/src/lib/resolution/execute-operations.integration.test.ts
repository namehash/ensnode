import { vi } from "vitest";

import { ENSNamespaceIds, ensTestEnvChain } from "@ensnode/datasources";

// we're testing a function specifically, not fetching through the running ensapi instance, so
// we need to mock the config when this worker process attempts to import ./execute-operations
// (and this is an integration test because we want to RPC fetch against the running devnet)
vi.mock("@/config", () => ({
  default: {
    namespace: ENSNamespaceIds.EnsTestEnv,
    rpcConfigs: new Map([[ensTestEnvChain.id, { httpRPCs: [new URL("http://localhost:8545")] }]]),
  },
}));

import {
  asInterpretedLabel,
  asInterpretedName,
  asLiteralLabel,
  encodeLabelHash,
  interpretedLabelsToInterpretedName,
  labelhashLiteralLabel,
  namehashInterpretedName,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { getDatasourceContract } from "@ensnode/ensnode-sdk";

import { getPublicClient } from "@/lib/public-client";
import { executeOperations } from "@/lib/resolution/execute-operations";
import { makeOperations } from "@/lib/resolution/operations";

const NAME = asInterpretedName("example.eth");
const NAME_WITH_ENCODED_LABELHASHES = interpretedLabelsToInterpretedName([
  asInterpretedLabel(encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("example")))),
  asInterpretedLabel("eth"),
]);

const EXPECTED_DESCRIPTION = "example.eth";

const publicClient = getPublicClient(ensTestEnvChain.id);

const UniversalResolverV2 = getDatasourceContract(
  ENSNamespaceIds.EnsTestEnv,
  DatasourceNames.ENSRoot,
  "UniversalResolverV2",
);

describe("executeOperations against UniversalResolver", () => {
  it("should resolve interpreted name without encoded labelhashes", async () => {
    const node = namehashInterpretedName(NAME);
    await expect(
      executeOperations({
        name: NAME,
        resolverAddress: UniversalResolverV2.address,
        useENSIP10Resolve: true,
        operations: makeOperations(node, { texts: ["description"] }),
        publicClient,
      }),
    ).resolves.toMatchObject([{ result: EXPECTED_DESCRIPTION }]);
  });

  /**
   * NOTE(shrugs): This was contrary to my expectations, but the NameCoder (in both ENSv1 and ENSv2)
   * is NOT EncodedLabelHash-aware: all label segments are hashed indiscriminately as LiteralLabels
   * to traverse the nametree, meaning that InterpretedNames (which may include EncodedLabelHash
   * segments for labels that are unknown, too long, or unnormalized) are explicitly unresolvable!
   *
   * Or, more technically, they resolve to an incorrect name, one addressed by, for example:
   * [root, labelhash("eth"), labelhash("[6fd43e7cffc31bb581d7421c8698e29aa2bd8e7186a394b85299908b4eb9b175]")]
   *
   * Which likely doesn't have the appropriate records set.
   */
  it("should NOT resolve interpreted name with encoded labelhashes", async () => {
    const node = namehashInterpretedName(NAME_WITH_ENCODED_LABELHASHES);
    await expect(
      executeOperations({
        name: NAME_WITH_ENCODED_LABELHASHES,
        resolverAddress: UniversalResolverV2.address,
        useENSIP10Resolve: true,
        operations: makeOperations(node, { texts: ["description"] }),
        publicClient,
      }),
    ).resolves.toMatchObject([{ result: null }]);
  });
});
