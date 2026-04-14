import { vi } from "vitest";

import { ENSNamespaceIds, ensTestEnvChain } from "@ensnode/datasources";

// we're testing a function specifically, not fetching through the running ensapi instance, so
// we need to mock the config when this worker process attempts to import ./resolve-with-universal-resolver
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

import { getPublicClient } from "@/lib/public-client";
import { makeResolveCalls } from "@/lib/resolution/resolve-calls-and-results";

import { executeResolveCallsWithUniversalResolver } from "./resolve-with-universal-resolver";

const NAME = asInterpretedName("example.eth");
const NAME_WITH_ENCODED_LABELHASHES = interpretedLabelsToInterpretedName([
  asInterpretedLabel(encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("example")))),
  asInterpretedLabel("eth"),
]);

const EXPECTED_DESCRIPTION = "example.eth";

const publicClient = getPublicClient(ensTestEnvChain.id);

describe("executeResolveCallsWithUniversalResolver", () => {
  it("should resolve interpreted name without encoded labelhashes", async () => {
    await expect(
      executeResolveCallsWithUniversalResolver({
        name: NAME,
        calls: makeResolveCalls(namehashInterpretedName(NAME), { texts: ["description"] }),
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
    await expect(
      executeResolveCallsWithUniversalResolver({
        name: NAME_WITH_ENCODED_LABELHASHES,
        calls: makeResolveCalls(namehashInterpretedName(NAME_WITH_ENCODED_LABELHASHES), {
          texts: ["description"],
        }),
        publicClient,
      }),
    ).resolves.toMatchObject([{ result: null }]);
  });
});
