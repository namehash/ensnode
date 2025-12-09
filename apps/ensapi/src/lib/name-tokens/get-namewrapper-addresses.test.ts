import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { getNameWrapperAddresses } from "./get-namewrapper-addresses";

describe("getNameWrapperAddresses", () => {
  describe("within Mainnet ENS Namespace", () => {
    it("returns NameWrapper address for Subgraph plugin", () => {
      expect(getNameWrapperAddresses(ENSNamespaceIds.Mainnet, [PluginName.Subgraph])).toStrictEqual(
        ["0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401"],
      );
    });

    it("returns NameWrapper address for Lineanames plugin", () => {
      expect(
        getNameWrapperAddresses(ENSNamespaceIds.Mainnet, [PluginName.Lineanames]),
      ).toStrictEqual(["0xa53cca02f98d590819141aa85c891e2af713c223"]);
    });

    it("returns NameWrapper address for Subgraph and Lineanames plugins", () => {
      expect(
        getNameWrapperAddresses(ENSNamespaceIds.Mainnet, [
          PluginName.Subgraph,
          PluginName.Lineanames,
        ]),
      ).toStrictEqual([
        "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
        "0xa53cca02f98d590819141aa85c891e2af713c223",
      ]);
    });
  });

  describe("within Sepolia ENS Namespace", () => {
    it("returns NameWrapper address for Subgraph plugin", () => {
      expect(getNameWrapperAddresses(ENSNamespaceIds.Sepolia, [PluginName.Subgraph])).toStrictEqual(
        ["0x0635513f179d50a207757e05759cbd106d7dfce8"],
      );
    });

    it("returns NameWrapper address for Lineanames plugin", () => {
      expect(
        getNameWrapperAddresses(ENSNamespaceIds.Sepolia, [PluginName.Lineanames]),
      ).toStrictEqual(["0xf127de9e039a789806fed4c6b1c0f3affea9425e"]);
    });

    it("returns NameWrapper address for Subgraph and Lineanames plugins", () => {
      expect(
        getNameWrapperAddresses(ENSNamespaceIds.Sepolia, [
          PluginName.Subgraph,
          PluginName.Lineanames,
        ]),
      ).toStrictEqual([
        "0x0635513f179d50a207757e05759cbd106d7dfce8",
        "0xf127de9e039a789806fed4c6b1c0f3affea9425e",
      ]);
    });
  });

  describe("within Holesky ENS Namespace", () => {
    it("returns NameWrapper address for Subgraph plugin", () => {
      expect(getNameWrapperAddresses(ENSNamespaceIds.Holesky, [PluginName.Subgraph])).toStrictEqual(
        ["0xab50971078225d365994dc1edcb9b7fd72bb4862"],
      );
    });
  });
});
