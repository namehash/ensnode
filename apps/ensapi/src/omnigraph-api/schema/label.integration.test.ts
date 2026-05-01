import {
  asInterpretedLabel,
  type Hex,
  type InterpretedLabel,
  type LabelHash,
  labelhashInterpretedLabel,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { LABELS_BY_HASHES_MAX } from "@/omnigraph-api/schema/label";
import { request } from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

type LabelsByHashesResult = {
  labels: Array<{ hash: LabelHash; interpreted: InterpretedLabel }>;
};

const LabelsByHashes = gql`
  query LabelsByHashes($hashes: [Hex!]!) {
    labels(by: { hashes: $hashes }) {
      hash
      interpreted
    }
  }
`;

// 'eth' is always seeded in the devnet fixture as a healed label
const ETH_LABEL_HASH: LabelHash = labelhashInterpretedLabel(asInterpretedLabel("eth"));

// a labelhash that should not exist in the index (random 0xff... bytes)
const ABSENT_LABEL_HASH = `0x${"ff".repeat(32)}` as LabelHash;

// `encodeLabelHash` produces `[<64 hex chars>]`; an `interpreted` value matching this regex is the
// "unhealed" representation. Used below to assert that a returned label is healed without
// reconstructing the encoded form per-row.
const ENCODED_LABEL_HASH_REGEX = /^\[[0-9a-fA-F]{64}\]$/;

describe("Query.labels", () => {
  it("returns a healed label entry for a known LabelHash", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, { hashes: [ETH_LABEL_HASH] }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH, interpreted: "eth" }],
    });
  });

  it("omits LabelHashes that are not present in the index", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, { hashes: [ABSENT_LABEL_HASH] }),
    ).resolves.toEqual({ labels: [] });
  });

  it("returns only the present labels when input mixes present and absent hashes", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, {
        hashes: [ETH_LABEL_HASH, ABSENT_LABEL_HASH],
      }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH }],
    });
  });

  it("dedupes repeated input hashes", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, {
        hashes: [ETH_LABEL_HASH, ETH_LABEL_HASH, ETH_LABEL_HASH],
      }),
    ).resolves.toMatchObject({
      labels: [{ hash: ETH_LABEL_HASH }],
    });
  });

  it("returns an empty list when input is empty", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, { hashes: [] as Hex[] }),
    ).resolves.toEqual({ labels: [] });
  });

  it("classifies returned labels: 'eth' is healed (interpreted !== encodeLabelHash(hash))", async () => {
    await expect(
      request<LabelsByHashesResult>(LabelsByHashes, { hashes: [ETH_LABEL_HASH] }),
    ).resolves.toMatchObject({
      labels: [
        {
          hash: ETH_LABEL_HASH,
          interpreted: expect.not.stringMatching(ENCODED_LABEL_HASH_REGEX),
        },
      ],
    });
  });

  it("rejects requests over the maximum allowed hash count", async () => {
    // generate (LABELS_BY_HASHES_MAX + 1) distinct labelhashes deterministically
    const hashes: LabelHash[] = [];
    for (let i = 0; i <= LABELS_BY_HASHES_MAX; i++) {
      const hex = i.toString(16).padStart(64, "0");
      hashes.push(`0x${hex}` as LabelHash);
    }

    await expect(request(LabelsByHashes, { hashes })).rejects.toThrow(/Too many hashes/);
  });
});
