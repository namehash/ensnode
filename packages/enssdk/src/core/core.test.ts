import { describe, expect, it, vi } from "vitest";

import { createEnsNodeClient } from "./index";

describe("createEnsNodeClient", () => {
  it("creates a client with frozen config", () => {
    const client = createEnsNodeClient({ url: "https://example.com" });

    expect(client.config.url).toBe("https://example.com");
    expect(client.config.fetch).toBeUndefined();
    expect(Object.isFrozen(client.config)).toBe(true);
  });

  it("preserves custom fetch in config", () => {
    const customFetch = vi.fn();
    const client = createEnsNodeClient({
      url: "https://example.com",
      fetch: customFetch as unknown as typeof globalThis.fetch,
    });

    expect(client.config.fetch).toBe(customFetch);
  });
});

describe("extend", () => {
  it("adds module properties to the client", () => {
    const client = createEnsNodeClient({ url: "https://example.com" }).extend(() => ({
      myModule: { greet: () => "hello" },
    }));

    expect(client.myModule.greet()).toBe("hello");
    expect(client.config.url).toBe("https://example.com");
  });

  it("passes the base client to the decorator function", () => {
    const client = createEnsNodeClient({ url: "https://example.com" }).extend((base) => ({
      meta: { getUrl: () => base.config.url },
    }));

    expect(client.meta.getUrl()).toBe("https://example.com");
  });

  it("supports chaining multiple extend calls", () => {
    const client = createEnsNodeClient({ url: "https://example.com" })
      .extend(() => ({ a: { value: 1 } }))
      .extend(() => ({ b: { value: 2 } }));

    expect(client.a.value).toBe(1);
    expect(client.b.value).toBe(2);
    expect(client.config.url).toBe("https://example.com");
  });

  it("later extensions can see earlier extensions via the base client", () => {
    const client = createEnsNodeClient({ url: "https://example.com" })
      .extend(() => ({ a: { value: 42 } }))
      .extend((base) => ({
        b: { doubled: () => base.a.value * 2 },
      }));

    expect(client.b.doubled()).toBe(84);
  });
});
