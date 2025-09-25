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

    it("handles partial defaulting of nested values", () => {
      // the above case tests all of the typescript types, so we use `any` here for convenience to
      // test runtime behavior for specific cases.

      // partial config provided by user
      const PROVIDED: any = { labelSet: { labelSetVersion: "1" } };

      // full default set
      const DEFAULTS: any = { labelSet: { labelSetId: "subgraph", labelSetVersion: "0" } };

      // applyDefaults correctly provides the nested value without clobbering user-provided nested value
      expect(applyDefaults(PROVIDED, DEFAULTS)).toStrictEqual({
        labelSet: {
          labelSetId: "subgraph",
          labelSetVersion: "1",
        },
      });
    });
  });
});
