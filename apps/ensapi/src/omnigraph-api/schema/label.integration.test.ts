import {
  asInterpretedLabel,
  encodeLabelHash,
  type InterpretedLabel,
  type LabelHash,
  labelhashInterpretedLabel,
  parseLabelHash,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { LABELS_BY_LABELHASH_MAX } from "@/omnigraph-api/schema/label";
import { request } from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

type LabelsByLabelHashResult = {
  labels: Array<{ hash: LabelHash; interpreted: InterpretedLabel }>;
};

const LabelsByLabelHash = gql`
  query LabelsByLabelHash($labelHashes: [LabelHash!]!) {
    labels(by: { labelHashes: $labelHashes }) {
      hash
      interpreted
    }
  }
`;

// 'eth' is always seeded in the devnet fixture as a healed label
const ETH_LABEL_HASH: LabelHash = labelhashInterpretedLabel(asInterpretedLabel("eth"));

// a LabelHash that should not exist in the index (deterministic dummy bytes)
const ABSENT_LABEL_HASH = parseLabelHash(`0x${"ff".repeat(32)}`);

describe("Query.labels", () => {
  it("returns a healed label entry for a known LabelHash", async () => {
    await expect(
      request<LabelsByLabelHashResult>(LabelsByLabelHash, { labelHashes: [ETH_LABEL_HASH] }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH, interpreted: "eth" }],
    });
  });

  it("accepts non-normalized (mixed-case hex) LabelHash variables and resolves matches", async () => {
    const uppercaseVariable = ETH_LABEL_HASH.toUpperCase();
    expect(parseLabelHash(uppercaseVariable)).toBe(ETH_LABEL_HASH);

    await expect(
      request<LabelsByLabelHashResult>(LabelsByLabelHash, {
        labelHashes: [uppercaseVariable as LabelHash],
      }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH, interpreted: "eth" }],
    });
  });

  it("omits LabelHashes that are not present in the index", async () => {
    await expect(
      request<LabelsByLabelHashResult>(LabelsByLabelHash, { labelHashes: [ABSENT_LABEL_HASH] }),
    ).resolves.toEqual({ labels: [] });
  });

  it("returns only the present labels when input mixes present and absent LabelHashes", async () => {
    await expect(
      request<LabelsByLabelHashResult>(LabelsByLabelHash, {
        labelHashes: [ETH_LABEL_HASH, ABSENT_LABEL_HASH],
      }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH }],
    });
  });

  it("dedupes repeated input LabelHashes", async () => {
    await expect(
      request<LabelsByLabelHashResult>(LabelsByLabelHash, {
        labelHashes: [ETH_LABEL_HASH, ETH_LABEL_HASH, ETH_LABEL_HASH],
      }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH }],
    });
  });

  it("returns an empty list when input is empty", async () => {
    await expect(request(LabelsByLabelHash, { labelHashes: [] })).resolves.toEqual({ labels: [] });
  });

  it("classifies returned labels: 'eth' is healed (interpreted !== encodeLabelHash(hash))", async () => {
    const { labels } = await request<LabelsByLabelHashResult>(LabelsByLabelHash, {
      labelHashes: [ETH_LABEL_HASH],
    });

    expect(labels).toHaveLength(1);
    expect(labels[0].interpreted).not.toEqual(encodeLabelHash(ETH_LABEL_HASH));
  });

  it("rejects junk strings that cannot be parsed as LabelHashes", async () => {
    await expect(
      request(LabelsByLabelHash, {
        labelHashes: ["not-even-hex"],
      }),
    ).rejects.toThrow(/Invalid labelHash/i);
  });

  it("rejects hex values that are not exactly 32 bytes", async () => {
    await expect(
      request(LabelsByLabelHash, {
        labelHashes: ["0x00"],
      }),
    ).rejects.toThrow(/Invalid labelHash/i);
  });

  it("rejects requests over the maximum allowed LabelHash count", async () => {
    const labelHashes: LabelHash[] = [];
    for (let i = 0; i <= LABELS_BY_LABELHASH_MAX; i++) {
      labelHashes.push(parseLabelHash(`0x${i.toString(16).padStart(64, "0")}`));
    }

    await expect(request(LabelsByLabelHash, { labelHashes })).rejects.toThrow(
      /Too many LabelHashes/i,
    );
  });
});
