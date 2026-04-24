import { describe, expect, it } from "vitest";

import { toJson } from "./to-json";

describe("toJson", () => {
  it("serializes bigints as strings", () => {
    expect(toJson({ n: 5n })).toBe('{"n":"5"}');
  });

  it("defaults to compact output", () => {
    expect(toJson({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });

  it("produces indented output when pretty is true", () => {
    expect(toJson({ a: 1 }, { pretty: true })).toBe('{\n  "a": 1\n}');
  });

  it("produces compact output when pretty is false", () => {
    expect(toJson({ a: 1 }, { pretty: false })).toBe('{"a":1}');
  });

  it("handles nested structures with bigints", () => {
    expect(toJson({ outer: { inner: 42n, xs: [1n, 2n] } })).toBe(
      '{"outer":{"inner":"42","xs":["1","2"]}}',
    );
  });

  it("pretty-prints nested structures with bigints", () => {
    expect(toJson({ outer: { n: 1n } }, { pretty: true })).toBe(
      '{\n  "outer": {\n    "n": "1"\n  }\n}',
    );
  });

  it("serializes primitives unchanged", () => {
    expect(toJson("hello")).toBe('"hello"');
    expect(toJson(42)).toBe("42");
    expect(toJson(true)).toBe("true");
    expect(toJson(null)).toBe("null");
  });

  it("preserves native toJSON behavior (Date)", () => {
    expect(toJson({ at: new Date("2020-01-01T00:00:00.000Z") })).toBe(
      '{"at":"2020-01-01T00:00:00.000Z"}',
    );
  });
});
