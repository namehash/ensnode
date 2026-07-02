import { describe, expect, it } from "vitest";

import { type EnsIndexerPublicConfig, PluginName } from "../ensindexer/config/types";
import { hasOmnigraphApiConfigSupport } from "./prerequisites";

// The gate only reads `config.plugins`, so a minimal cast suffices.
const configWithPlugins = (plugins: PluginName[]) =>
  ({ plugins }) as unknown as EnsIndexerPublicConfig;

describe("hasOmnigraphApiConfigSupport", () => {
  it("is supported by unigraph or ensv2", () => {
    expect(hasOmnigraphApiConfigSupport(configWithPlugins([PluginName.Unigraph])).supported).toBe(
      true,
    );
    expect(hasOmnigraphApiConfigSupport(configWithPlugins([PluginName.ENSv2])).supported).toBe(
      true,
    );
  });

  it("is unsupported without one of those plugins", () => {
    const result = hasOmnigraphApiConfigSupport(configWithPlugins([PluginName.Subgraph]));
    expect(result.supported).toBe(false);
  });
});
