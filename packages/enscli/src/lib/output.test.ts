import { afterEach, describe, expect, it } from "vitest";

import { resolveFormat } from "./output";

function setTTY(value: boolean): void {
  Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
}

const originalIsTTY = process.stdout.isTTY;
afterEach(() => {
  Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, configurable: true });
});

describe("resolveFormat", () => {
  it("honors an explicit --output", () => {
    expect(resolveFormat({ output: "json" })).toBe("json");
    expect(resolveFormat({ output: "pretty" })).toBe("pretty");
  });

  it("throws on an invalid --output", () => {
    expect(() => resolveFormat({ output: "yaml" })).toThrow(/Expected "json" or "pretty"/);
  });

  it("defaults to json when piped and pretty in a TTY", () => {
    setTTY(false);
    expect(resolveFormat({})).toBe("json");
    setTTY(true);
    expect(resolveFormat({})).toBe("pretty");
  });
});
