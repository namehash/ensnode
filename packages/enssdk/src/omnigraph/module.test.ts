import { parse } from "graphql";
import { describe, expect, it, vi } from "vitest";

import { createEnsNodeClient } from "../core/index";
import { omnigraph } from "./module";

function createMockClient(mockFetch: ReturnType<typeof vi.fn>) {
  return createEnsNodeClient({
    url: "https://example.com",
    fetch: mockFetch as unknown as typeof globalThis.fetch,
  }).extend(omnigraph);
}

describe("omnigraph module", () => {
  it("attaches omnigraph namespace to client", () => {
    const client = createEnsNodeClient({ url: "https://example.com" }).extend(omnigraph);

    expect(client.omnigraph).toBeDefined();
    expect(typeof client.omnigraph.query).toBe("function");
  });

  it("sends a POST request with string query", async () => {
    const mockResponse = { data: { domain: { name: "nick.eth" } } };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const client = createMockClient(mockFetch);

    const result = await client.omnigraph.query({
      query: 'query { domain(by: { name: "nick.eth" }) { name } }',
    });

    expect(mockFetch).toHaveBeenCalledWith("https://example.com/api/omnigraph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: 'query { domain(by: { name: "nick.eth" }) { name } }',
        variables: undefined,
      }),
      signal: undefined,
    });

    expect(result).toEqual(mockResponse);
  });

  it("sends variables when provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const client = createMockClient(mockFetch);

    await client.omnigraph.query({
      query: "query($name: String!) { domain(by: { name: $name }) { name } }",
      variables: { name: "nick.eth" },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ name: "nick.eth" });
  });

  it("passes signal for abort support", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });
    const controller = new AbortController();

    const client = createMockClient(mockFetch);

    await client.omnigraph.query({
      query: "query { domains { name } }",
      signal: controller.signal,
    });

    expect(mockFetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("throws on non-2xx response with body included", async () => {
    const errorBody = JSON.stringify({ errors: [{ message: "Unauthorized" }] });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve(errorBody),
    });

    const client = createMockClient(mockFetch);

    await expect(
      client.omnigraph.query({ query: 'query { domain(by: { name: "eth" }) { name } }' }),
    ).rejects.toThrow(`Omnigraph query failed: 401 Unauthorized\n${errorBody}`);
  });

  it("prints DocumentNode queries to string", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const client = createMockClient(mockFetch);
    const doc = parse('query { domain(by: { name: "nick.eth" }) { name } }');

    await client.omnigraph.query({ query: doc });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.query).toContain("domain");
    expect(body.query).toContain("nick.eth");
  });
});
