import { makeEventId, makeRegistrationId, makeResolverId } from "@/lib/ids";
import { PluginName } from "@ensnode/utils";
import { labelhash, namehash, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

const CHAIN_ID = 1337;
const OTHER_PLUGIN_NAME = "other" as PluginName;

describe("ids", () => {
  describe("makeResolverId", () => {
    it("should construct subgraph-compatible resolver id", () => {
      expect(
        makeResolverId(PluginName.Subgraph, CHAIN_ID, zeroAddress, namehash("vitalik.eth")),
      ).toEqual(
        "0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      );
    });

    it("should construct chain-scoped resolver id", () => {
      expect(
        makeResolverId(OTHER_PLUGIN_NAME, CHAIN_ID, zeroAddress, namehash("vitalik.eth")),
      ).toEqual(
        "1337-0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      );
    });

    it("should lowercase address", () => {
      expect(
        makeResolverId(PluginName.Subgraph, CHAIN_ID, "0xCAFE", namehash("vitalik.eth")),
      ).toEqual("0xcafe-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835");
    });
  });

  describe("makeEventId", () => {
    it("should include transferIndex if available", () => {
      expect(makeEventId(PluginName.Subgraph, 1, 123n, 456)).toEqual("123-456");
      expect(makeEventId(PluginName.Subgraph, 1, 123n, 456, 1)).toEqual("123-456-1");
    });

    it("should not include chainId if subgraph plugin", () => {
      expect(makeEventId(PluginName.Subgraph, CHAIN_ID, 123n, 456)).toEqual("123-456");
    });

    it("should include chainId for other plugins", () => {
      expect(makeEventId(OTHER_PLUGIN_NAME, CHAIN_ID, 123n, 456)).toEqual("1337-123-456");
    });
  });

  describe("makeRegistrationId", () => {
    it("should use the labelHash of the registered name when plugin name is `subgraph`", () => {
      expect(
        makeRegistrationId(PluginName.Subgraph, labelhash("vitalik"), namehash("vitalik.eth")),
      ).toEqual(labelhash("vitalik"));
    });

    it("should use the node of the registered name when plugin name is not `subgraph`", () => {
      expect(
        makeRegistrationId(OTHER_PLUGIN_NAME, labelhash("vitalik"), namehash("vitalik.linea.eth")),
      ).toEqual(namehash("vitalik.linea.eth"));
    });
  });
});
