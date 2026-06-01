import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveEnsNodeUrl, resolveEnsRainbowUrl, resolveNamespace } from "./config";

const ENV_KEYS = ["NAMESPACE", "ENSNODE_URL", "ENSRAINBOW_URL"] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("resolveNamespace", () => {
  it("defaults to mainnet", () => {
    expect(resolveNamespace({})).toBe("mainnet");
  });

  it("reads the --namespace flag", () => {
    expect(resolveNamespace({ namespace: "sepolia" })).toBe("sepolia");
  });

  it("falls back to the NAMESPACE env var", () => {
    process.env.NAMESPACE = "sepolia-v2";
    expect(resolveNamespace({})).toBe("sepolia-v2");
  });

  it("prefers the flag over the env var", () => {
    process.env.NAMESPACE = "sepolia";
    expect(resolveNamespace({ namespace: "mainnet" })).toBe("mainnet");
  });

  it("throws on an unknown namespace", () => {
    expect(() => resolveNamespace({ namespace: "bogus" })).toThrow(/Invalid namespace/);
  });
});

describe("resolveEnsNodeUrl", () => {
  it("uses the hosted default for the namespace", () => {
    expect(resolveEnsNodeUrl({}).href).toBe("https://api.alpha.ensnode.io/");
    expect(resolveEnsNodeUrl({ namespace: "sepolia-v2" }).href).toBe(
      "https://api.v2-sepolia.ensnode.io/",
    );
  });

  it("throws a directive error for namespaces without a hosted default", () => {
    expect(() => resolveEnsNodeUrl({ namespace: "ens-test-env" })).toThrow(/--ensnode-url/);
  });

  it("prefers an explicit --ensnode-url over the namespace default", () => {
    expect(resolveEnsNodeUrl({ "ensnode-url": "http://localhost:4334" }).href).toBe(
      "http://localhost:4334/",
    );
  });

  it("falls back to the ENSNODE_URL env var", () => {
    process.env.ENSNODE_URL = "http://localhost:9999";
    expect(resolveEnsNodeUrl({ namespace: "ens-test-env" }).href).toBe("http://localhost:9999/");
  });
});

describe("resolveEnsRainbowUrl", () => {
  it("prefers an explicit --ensrainbow-url", () => {
    expect(resolveEnsRainbowUrl({ "ensrainbow-url": "http://localhost:3223" }).href).toBe(
      "http://localhost:3223/",
    );
  });
});
