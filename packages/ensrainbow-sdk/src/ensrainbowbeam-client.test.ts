import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_ENSRAINBOWBEAM_URL,
  ENSRAINBOWBEAM_DISCOVER_MAX_LABELS,
  EnsRainbowBeamClient,
  EnsRainbowBeamHttpError,
  validateDiscoverParams,
} from "./ensrainbowbeam-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("validateDiscoverParams", () => {
  const caller = "0x1234567890123456789012345678901234567890";

  it("accepts valid input and lowercases caller", () => {
    expect(
      validateDiscoverParams({
        labels: ["a"],
        callerAddress: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
      }),
    ).toEqual({
      labels: ["a"],
      callerAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
  });

  it("rejects empty labels array", () => {
    expect(() => validateDiscoverParams({ labels: [], callerAddress: caller })).toThrow(
      /non-empty array/i,
    );
  });

  it("rejects too many labels", () => {
    const labels = Array.from(
      { length: ENSRAINBOWBEAM_DISCOVER_MAX_LABELS + 1 },
      (_, i) => `x${i}`,
    );
    expect(() => validateDiscoverParams({ labels, callerAddress: caller })).toThrow(/at most 100/i);
  });

  it("rejects empty string label", () => {
    expect(() => validateDiscoverParams({ labels: [""], callerAddress: caller })).toThrow(
      /non-empty/i,
    );
  });

  it("rejects invalid caller", () => {
    expect(() =>
      validateDiscoverParams({ labels: ["x"], callerAddress: "not-an-address" }),
    ).toThrow(/does not represent an EVM Address/i);
  });
});

describe("EnsRainbowBeamClient", () => {
  let client: EnsRainbowBeamClient;

  beforeEach(() => {
    client = new EnsRainbowBeamClient({ baseUrl: new URL("http://beam.test") });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults base URL to localhost:4444", () => {
    const defaultClient = new EnsRainbowBeamClient();
    expect(defaultClient).toBeDefined();
    // baseUrl is private; behavior covered by URL construction in health test with explicit URL
    expect(DEFAULT_ENSRAINBOWBEAM_URL).toBe("http://localhost:4444");
  });

  it("health resolves on 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ message: "ok" }),
    });

    await expect(client.health()).resolves.toEqual({ message: "ok" });

    expect(mockFetch).toHaveBeenCalledWith(
      new URL("http://beam.test/health"),
      expect.objectContaining({ signal: undefined }),
    );
  });

  it("health throws EnsRainbowBeamHttpError on non-ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: () => Promise.resolve({ message: "down" }),
    });

    await expect(client.health()).rejects.toMatchObject({
      name: "EnsRainbowBeamHttpError",
      message: "down",
      status: 503,
      statusText: "Service Unavailable",
    });
  });

  it("discover posts JSON body and resolves", async () => {
    const caller = "0x1234567890123456789012345678901234567890";
    const payload = {
      callerAddress: caller,
      results: [
        {
          rawLabel: "eth",
          labelHash: "0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0" as const,
          status: "healed_in_index" as const,
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve(payload),
    });

    await expect(client.discover({ labels: ["eth"], callerAddress: caller })).resolves.toEqual(
      payload,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      new URL("http://beam.test/api/discover"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["eth"], callerAddress: caller }),
      }),
    );
  });

  it("discover throws before fetch when validation fails", async () => {
    await expect(
      client.discover({
        labels: [],
        callerAddress: "0x1234567890123456789012345678901234567890",
      }),
    ).rejects.toThrow(/non-empty array/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("discover throws EnsRainbowBeamHttpError with message and details on 400", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () =>
        Promise.resolve({
          message: "Invalid Input",
          details: { formErrors: [], fieldErrors: {} },
        }),
    });

    try {
      await client.discover({
        labels: ["x"],
        callerAddress: "0x1234567890123456789012345678901234567890",
      });
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(EnsRainbowBeamHttpError);
      const err = e as EnsRainbowBeamHttpError;
      expect(err.message).toBe("Invalid Input");
      expect(err.status).toBe(400);
      expect(err.details).toEqual({ formErrors: [], fieldErrors: {} });
    }
  });

  it("discover throws EnsRainbowBeamHttpError on 502", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.resolve({ message: "Upstream Omnigraph lookup failed" }),
    });

    await expect(
      client.discover({
        labels: ["x"],
        callerAddress: "0x1234567890123456789012345678901234567890",
      }),
    ).rejects.toMatchObject({
      name: "EnsRainbowBeamHttpError",
      message: "Upstream Omnigraph lookup failed",
      status: 502,
    });
  });

  it("discover throws EnsRainbowBeamHttpError on 504", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 504,
      statusText: "Gateway Timeout",
      json: () =>
        Promise.resolve({
          message: "Omnigraph labels lookup timed out after 10000ms",
        }),
    });

    await expect(
      client.discover({
        labels: ["x"],
        callerAddress: "0x1234567890123456789012345678901234567890",
      }),
    ).rejects.toMatchObject({
      name: "EnsRainbowBeamHttpError",
      message: "Omnigraph labels lookup timed out after 10000ms",
      status: 504,
    });
  });

  it("uses injected fetch", async () => {
    const customFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ message: "ok" }),
    });

    const c = new EnsRainbowBeamClient({
      baseUrl: "http://custom.example",
      fetch: customFetch as typeof fetch,
    });

    await c.health();
    expect(customFetch).toHaveBeenCalledWith(
      new URL("http://custom.example/health"),
      expect.anything(),
    );
  });
});
