import { describe, expect, it } from "vitest";

import {
  interpretNameFromUserInput,
  NameInterpretationOutcomeResult,
} from "./interpret-name-from-user-input";

describe("interpretNameFromUserInput", () => {
  describe("Empty outcome", () => {
    it("returns Empty for empty string", () => {
      const result = interpretNameFromUserInput("");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Empty);
      expect(result.interpretation).toBe("");
    });

    it("returns Empty for whitespace-only string", () => {
      const result = interpretNameFromUserInput("   ");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Empty);
      expect(result.interpretation).toBe("");
    });

    it("returns Empty for tab/newline whitespace", () => {
      const result = interpretNameFromUserInput("\t\n");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Empty);
      expect(result.interpretation).toBe("");
    });
  });

  describe("Normalized outcome", () => {
    it("returns Normalized for already-normalized name", () => {
      const result = interpretNameFromUserInput("vitalik.eth");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Normalized);
      expect(result.interpretation).toBe("vitalik.eth");
    });

    it("normalizes uppercase to lowercase", () => {
      const result = interpretNameFromUserInput("VITALIK.ETH");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Normalized);
      expect(result.interpretation).toBe("vitalik.eth");
    });

    it("normalizes mixed case", () => {
      const result = interpretNameFromUserInput("LiGhTWaLkEr.EtH");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Normalized);
      expect(result.interpretation).toBe("lightwalker.eth");
    });

    it("preserves inputName in result", () => {
      const result = interpretNameFromUserInput("VITALIK.ETH");
      expect(result.inputName).toBe("VITALIK.ETH");
    });

    it("handles single-label name", () => {
      const result = interpretNameFromUserInput("eth");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Normalized);
      expect(result.interpretation).toBe("eth");
    });
  });

  describe("Reencoded outcome", () => {
    it("returns Reencoded for encoded labelhash input", () => {
      const result = interpretNameFromUserInput(
        "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth",
      );
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Reencoded);
      expect(result.interpretation).toBe(
        "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth",
      );
    });

    it("lowercases encoded labelhash hex", () => {
      const result = interpretNameFromUserInput(
        "[E4310BF4547CB18B16B5348881D24A66D61FA94A013E5636B730B86EE64A3923].eth",
      );
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Reencoded);
      expect(result.interpretation).toBe(
        "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth",
      );
    });

    it("handles multiple encoded labelhash labels", () => {
      const result = interpretNameFromUserInput(
        "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]",
      );
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Reencoded);
    });
  });

  describe("Encoded outcome", () => {
    it("returns Encoded for invalid characters", () => {
      const result = interpretNameFromUserInput("abc|123.eth");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Encoded);
      // The unnormalizable label gets encoded as a labelhash
      expect(result.interpretation).toMatch(/^\[.{64}\]\.eth$/);
    });

    it("returns Encoded for empty labels (consecutive dots)", () => {
      const result = interpretNameFromUserInput("abc..123");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Encoded);
      if (result.outcome === NameInterpretationOutcomeResult.Encoded) {
        expect(result.hadEmptyLabels).toBe(true);
      }
    });

    it("returns Encoded for single dot", () => {
      const result = interpretNameFromUserInput(".");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Encoded);
      if (result.outcome === NameInterpretationOutcomeResult.Encoded) {
        expect(result.hadEmptyLabels).toBe(true);
      }
    });

    it("returns Encoded for space (non-trimmed, non-empty)", () => {
      // " " trims to "" so this is Empty, but "a b" has a space inside a label
      const result = interpretNameFromUserInput("a b.eth");
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Encoded);
    });

    it("preserves inputName in Encoded result", () => {
      const result = interpretNameFromUserInput("abc|123.eth");
      expect(result.inputName).toBe("abc|123.eth");
    });

    it("hadEmptyLabels is false when no empty labels", () => {
      const result = interpretNameFromUserInput("abc|123.eth");
      if (result.outcome === NameInterpretationOutcomeResult.Encoded) {
        expect(result.hadEmptyLabels).toBe(false);
      }
    });
  });

  describe("mixed label scenarios", () => {
    it("normalizable + encoded labelhash = Reencoded", () => {
      const result = interpretNameFromUserInput(
        "VITALIK.[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923]",
      );
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Reencoded);
      expect(result.interpretation.startsWith("vitalik.")).toBe(true);
    });

    it("unnormalizable takes priority over reencoded", () => {
      const result = interpretNameFromUserInput(
        "abc|123.[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923]",
      );
      expect(result.outcome).toBe(NameInterpretationOutcomeResult.Encoded);
    });

    it("always produces a valid interpretation string", () => {
      const inputs = [
        "vitalik.eth",
        "VITALIK.ETH",
        "abc|123.eth",
        "abc..123",
        ".",
        "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth",
      ];
      for (const input of inputs) {
        const result = interpretNameFromUserInput(input);
        expect(typeof result.interpretation).toBe("string");
        expect(result.interpretation.length).toBeGreaterThan(0);
      }
    });
  });
});
