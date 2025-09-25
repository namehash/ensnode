import { applyDefaults } from "@/config/environment-defaults";
import { DeepPartial } from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

interface ExampleEnvironment {
  defined: string | undefined;
  undefined: string | undefined;
  undefaulted: string | undefined;
  nested: {
    defined: string | undefined;
    undefined: string | undefined;
    undefaulted: string | undefined;
  };
}

const EXAMPLE: ExampleEnvironment = {
  defined: "defined",
  undefined: undefined,
  undefaulted: undefined,
  nested: {
    defined: "defined",
    undefined: undefined,
    undefaulted: undefined,
  },
};

const DEFAULTS: DeepPartial<ExampleEnvironment> = {
  defined: "defaulted",
  undefined: "defaulted",
  nested: {
    defined: "defaulted",
    undefined: "defaulted",
  },
};

describe("environment-defaults", () => {
  describe("applyDefaults", () => {
    it("applies partial defaults, including nested, ignoring undefaulted", () => {
      expect(applyDefaults(EXAMPLE, DEFAULTS)).toStrictEqual({
        defined: "defined",
        undefined: "defaulted",
        undefaulted: undefined,
        nested: {
          defined: "defined",
          undefined: "defaulted",
          undefaulted: undefined,
        },
      });
    });
  });
});
