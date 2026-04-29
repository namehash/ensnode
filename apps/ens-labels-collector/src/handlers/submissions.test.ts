import {
  encodeLabelHash,
  type InterpretedLabel,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
} from "enssdk";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/omnigraph-client", () => ({
  lookupLabels: vi.fn(),
}));

import { errorResponse } from "@/lib/error-response";
import type { LabelHit } from "@/lib/labels";
import { lookupLabels } from "@/lib/omnigraph-client";

import { type SubmissionsResponse, submissionsHandler } from "./submissions";

const mockedLookup = vi.mocked(lookupLabels);

function makeApp() {
  const app = new Hono();
  app.post("/api/submissions", submissionsHandler);
  app.onError((error, c) => errorResponse(c, { error }));
  return app;
}

const CALLER = "0x1234567890123456789012345678901234567890";

describe("POST /api/submissions", () => {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    mockedLookup.mockReset();
    consoleSpy.mockClear();
  });

  it("400s on malformed JSON", async () => {
    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it("400s when labels is empty", async () => {
    const app = makeApp();
    mockedLookup.mockResolvedValue([]);
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: [], callerAddress: CALLER }),
    });
    expect(res.status).toBe(400);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it("400s when callerAddress is not a valid EVM address", async () => {
    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["foo"], callerAddress: "not-an-address" }),
    });
    expect(res.status).toBe(400);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it("classifies a healed label correctly and emits exactly one log line", async () => {
    const ethHash = labelhashLiteralLabel("eth" as LiteralLabel);
    mockedLookup.mockResolvedValue([
      { hash: ethHash, interpreted: "eth" as InterpretedLabel } satisfies LabelHit,
    ]);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["eth"], callerAddress: CALLER }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as SubmissionsResponse;
    expect(json.callerAddress).toBe(CALLER);
    expect(json.results).toHaveLength(1);
    expect(json.results[0]).toMatchObject({
      rawLabel: "eth",
      labelHash: ethHash,
      status: "healed_in_index",
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [loggedLine] = consoleSpy.mock.calls[0] as [string];
    const parsed = JSON.parse(loggedLine) as {
      ts: string;
      requestId: string;
      callerAddress: string;
      items: Array<{ status: string }>;
    };
    expect(parsed.callerAddress).toBe(CALLER);
    expect(parsed.items[0].status).toBe("healed_in_index");
  });

  it("classifies an unhealed label as unknown_in_index", async () => {
    const fooHash = labelhashLiteralLabel("foo" as LiteralLabel);
    mockedLookup.mockResolvedValue([
      { hash: fooHash, interpreted: encodeLabelHash(fooHash) as InterpretedLabel },
    ]);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["foo"], callerAddress: CALLER }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as SubmissionsResponse;
    expect(json.results[0].status).toBe("unknown_in_index");
  });

  it("classifies an absent label as absent_from_index", async () => {
    mockedLookup.mockResolvedValue([]);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        labels: ["zzznever-existszzz"],
        callerAddress: CALLER,
      }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as SubmissionsResponse;
    expect(json.results[0].status).toBe("absent_from_index");
  });

  it("normalizes the callerAddress to lowercase in both the response and the log", async () => {
    mockedLookup.mockResolvedValue([]);
    const mixedCase = "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa";

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["foo"], callerAddress: mixedCase }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as SubmissionsResponse;
    expect(json.callerAddress).toBe(mixedCase.toLowerCase());

    const [loggedLine] = consoleSpy.mock.calls[0] as [string];
    const parsed = JSON.parse(loggedLine) as { callerAddress: string };
    expect(parsed.callerAddress).toBe(mixedCase.toLowerCase());
  });

  it("includes normalized variants in the output when raw differs from normalized", async () => {
    mockedLookup.mockResolvedValue([]);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["VITALIK"], callerAddress: CALLER }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as SubmissionsResponse;
    expect(json.results[0]).toMatchObject({
      rawLabel: "VITALIK",
      normalizedLabel: "vitalik",
    });
    expect(json.results[0].normalizedLabelHash).toBeDefined();
  });

  it("rejects oversized batches", async () => {
    const labels = Array.from({ length: 100 }, (_, i) => `label-${i}`);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels, callerAddress: CALLER }),
    });
    expect(res.status).toBe(400);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it("dedupes labelhashes before calling the omnigraph client", async () => {
    mockedLookup.mockResolvedValue([]);

    const app = makeApp();
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["foo", "foo", "foo"], callerAddress: CALLER }),
    });

    expect(res.status).toBe(200);
    expect(mockedLookup).toHaveBeenCalledTimes(1);

    const fooHash = labelhashLiteralLabel("foo" as LiteralLabel);
    const passedHashes = mockedLookup.mock.calls[0][0] as readonly LabelHash[];
    expect(new Set(passedHashes)).toEqual(new Set([fooHash]));
  });
});
