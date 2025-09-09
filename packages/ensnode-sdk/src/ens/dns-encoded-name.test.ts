import { bytesToHex, labelhash, stringToHex } from "viem";
import { packetToBytes } from "viem/ens";
import { describe, expect, it } from "vitest";

import { decodeDNSEncodedName } from "./dns-encoded-name";
import { encodeLabelHash } from "./encode-labelhash";
import type { DNSEncodedName } from "./types";

const MULTI_BYTE_UNICODE_NAMES = ["👩🏼‍❤‍💋‍👨🏼.eth"];

describe("decodeDNSEncodedName", () => {
  it("handles root node", () => {
    expect(decodeDNSEncodedName(bytesToHex(packetToBytes("")))).toEqual([]);
  });

  it("handles obvious case", () => {
    expect(decodeDNSEncodedName(bytesToHex(packetToBytes("vitalik.eth")))).toEqual([
      "vitalik",
      "eth",
    ]);
  });

  it("throws for empty input", () => {
    expect(() => decodeDNSEncodedName("" as DNSEncodedName)).toThrow(/empty/i);
  });

  it("throws for empty packet", () => {
    expect(() => decodeDNSEncodedName("0x")).toThrow(/empty/i);
  });

  it("parses example input", () => {
    expect(decodeDNSEncodedName(stringToHex("\x03aaa\x02bb\x01c\x00"))).toEqual(["aaa", "bb", "c"]);
  });

  it("handles junk", () => {
    expect(decodeDNSEncodedName(stringToHex("\x03aaa\x00"))).toEqual(["aaa"]);
    expect(() => decodeDNSEncodedName(stringToHex("\x03aaa\x00junk"))).toThrow(/junk/i);
  });

  it("handles overflow", () => {
    expect(() => decodeDNSEncodedName(stringToHex("\x06aaa\x00"))).toThrow(/overflow/i);
  });

  it("correctly decodes labels with period", () => {
    expect(decodeDNSEncodedName(stringToHex("\x03a.a\x00"))).toEqual(["a.a"]);
  });

  it("correctly decodes labels with NULL", () => {
    expect(decodeDNSEncodedName(stringToHex("\x03\0\0\0\x00"))).toEqual(["\0\0\0"]);
  });

  it("correctly decodes encoded-labelhash-looking-strings", () => {
    const literalLabelThatLooksLikeALabelHash = encodeLabelHash(labelhash("test"));

    expect(
      decodeDNSEncodedName(stringToHex(`\x42${literalLabelThatLooksLikeALabelHash}\x00`)),
    ).toEqual([literalLabelThatLooksLikeALabelHash]);
  });

  it("correctly decodes multi-byte unicode", () => {
    MULTI_BYTE_UNICODE_NAMES.forEach((name) =>
      expect(decodeDNSEncodedName(bytesToHex(packetToBytes(name)))).toEqual(name.split(".")),
    );
  });
});
