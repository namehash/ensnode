import {
  asInterpretedLabel,
  asInterpretedName,
  asLiteralLabel,
  encodeLabelHash,
  interpretedLabelsToInterpretedName,
  labelhashLiteralLabel,
} from "enssdk";
import { bytesToHex, stringToHex } from "viem";
import { packetToBytes } from "viem/ens";
import { describe, expect, it } from "vitest";

const TEST_LABEL = asLiteralLabel("test");
const ENCODED_LABEL_HASH = asInterpretedLabel(encodeLabelHash(labelhashLiteralLabel(TEST_LABEL)));

describe("packetToBytes", () => {
  it("correctly DNS-encodes an InterpretedName containing an encoded labelhash label", () => {
    const name = asInterpretedName(
      interpretedLabelsToInterpretedName([ENCODED_LABEL_HASH, asInterpretedLabel("eth")]),
    );
    const expectedLabelHex = stringToHex(ENCODED_LABEL_HASH).slice(2);

    // The encoded labelhash label (e.g. "[9c22ff...b658]") is 66 characters and should
    // be DNS-encoded as a single label: length prefix 0x42 (66) followed by its UTF-8 bytes,
    // followed by the 'eth' label with length (03 65 74 68) and null terminator (00)
    const result = bytesToHex(packetToBytes(name));
    expect(result).toEqual(`0x42${expectedLabelHex}0365746800`);
  });

  it("encodes an encoded labelhash label differently from the plaintext label", () => {
    const fromPlaintext = bytesToHex(packetToBytes(`${TEST_LABEL}.eth`));
    const fromEncodedLabelHash = bytesToHex(packetToBytes(`${ENCODED_LABEL_HASH}.eth`));

    // The plaintext "test" label is 4 bytes (length prefix 0x04), while the encoded
    // labelhash "[9c22ff...b658]" is 66 bytes (length prefix 0x42). These produce
    // different DNS encodings because the resolver uses the labelhash to look up
    // records when the original label is unknown.
    expect(fromPlaintext).toMatch(/^0x04/);
    expect(fromEncodedLabelHash).toMatch(/^0x42/);
    expect(fromEncodedLabelHash).not.toEqual(fromPlaintext);
  });
});
