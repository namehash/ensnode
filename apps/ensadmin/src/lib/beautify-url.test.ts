import { describe, expect, it } from "vitest";
import { beautifyUrl } from "./beautify-url";

describe("beautifyUrl", () => {
  it("removes protocol and keeps host/path", () => {
    const url = new URL("https://example.com/foo/bar");
    expect(beautifyUrl(url)).toBe("example.com/foo/bar");
  });

  it("removes trailing slash if not root", () => {
    const url = new URL("https://example.com/foo/");
    expect(beautifyUrl(url)).toBe("example.com/foo");
  });

  it("keeps trailing slash for root", () => {
    const url = new URL("https://example.com/");
    expect(beautifyUrl(url)).toBe("example.com");
  });

  it("keeps search and hash", () => {
    const url = new URL("https://example.com/foo/?a=1#section");
    expect(beautifyUrl(url)).toBe("example.com/foo/?a=1#section");
  });

  it("removes trailing slash only if no search/hash", () => {
    const url = new URL("https://example.com/foo/?a=1/");
    expect(beautifyUrl(url)).toBe("example.com/foo/?a=1/");
  });
});
