import { type LiteralLabel, labelhashLiteralLabel, literalLabelToInterpretedLabel } from "enssdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the cascade so we can assert whether a heal triggers it.
vi.mock("./canonicality-db-helpers", () => ({ cascadeLabelHeal: vi.fn() }));
// Stub transitive imports that would otherwise load `@/config` (which `process.exit`s without env).
vi.mock("@/lib/graphnode-helpers", () => ({ labelByLabelHash: vi.fn() }));
vi.mock("@/lib/indexing-engines/ponder", () => ({ ensIndexerSchema: { label: {} } }));

import { cascadeLabelHeal } from "./canonicality-db-helpers";
import { ensureLabel } from "./label-db-helpers";

type LabelRow = { labelHash: string; interpreted: string };

/**
 * A fake Ponder Store API that reproduces the in-place aliasing of the real one: `find` returns a
 * LIVE reference to the buffered row, and `onConflictDoUpdate({ interpreted })` mutates THAT SAME
 * object's `interpreted` field. A regression guard for the heal cascade silently never firing when
 * the heal check is evaluated against the (already-mutated) `prev` after the upsert.
 */
function makeContext(initial: Record<string, LabelRow>) {
  const rows = new Map<string, LabelRow>(Object.entries(initial).map(([lh, r]) => [lh, { ...r }]));
  const ensDb = {
    find: vi.fn(
      async (_table: unknown, { labelHash }: { labelHash: string }) => rows.get(labelHash) ?? null,
    ),
    insert: (_table: unknown) => ({
      values: ({ labelHash, interpreted }: LabelRow) => ({
        onConflictDoUpdate: async ({ interpreted: next }: { interpreted: string }) => {
          const existing = rows.get(labelHash);
          if (existing)
            existing.interpreted = next; // in-place mutation (the aliasing footgun)
          else rows.set(labelHash, { labelHash, interpreted });
        },
      }),
    }),
  };
  return { context: { ensDb } as never, rows };
}

describe("ensureLabel heal cascade", () => {
  beforeEach(() => vi.mocked(cascadeLabelHeal).mockClear());

  it("cascades when an existing unknown label is healed, despite in-place find/upsert aliasing", async () => {
    const label = "zero" as LiteralLabel;
    const labelHash = labelhashLiteralLabel(label);
    const encoded = `[${labelHash.slice(2)}]`; // the unknown-encoded form previously stored
    const { context, rows } = makeContext({ [labelHash]: { labelHash, interpreted: encoded } });

    await ensureLabel(context, label);

    expect(cascadeLabelHeal).toHaveBeenCalledTimes(1);
    expect(cascadeLabelHeal).toHaveBeenCalledWith(context, labelHash);
    expect(rows.get(labelHash)?.interpreted).toBe(literalLabelToInterpretedLabel(label));
  });

  it("does not cascade on first sight (no prior row)", async () => {
    const label = "zero" as LiteralLabel;
    const { context } = makeContext({});

    await ensureLabel(context, label);

    expect(cascadeLabelHeal).not.toHaveBeenCalled();
  });

  it("does not cascade when the interpreted value is unchanged", async () => {
    const label = "zero" as LiteralLabel;
    const labelHash = labelhashLiteralLabel(label);
    const interpreted = literalLabelToInterpretedLabel(label);
    const { context } = makeContext({ [labelHash]: { labelHash, interpreted } });

    await ensureLabel(context, label);

    expect(cascadeLabelHeal).not.toHaveBeenCalled();
  });
});
