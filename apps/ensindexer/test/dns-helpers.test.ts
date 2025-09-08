import { bytesToPacket, packetToBytes } from "@ensdomains/ensjs/utils";
import type { TxtAnswer } from "dns-packet";
import { bytesToHex, decodeEventLog, labelhash, stringToBytes, stringToHex, zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import {
  decodeDNSEncodedName,
  decodeTXTData,
  parseDnsTxtRecordArgs,
  parseRRSet,
  subgraph_decodeDNSEncodedLiteralName,
} from "@/lib/dns-helpers";
import { getDatasource } from "@ensnode/datasources";
import { DNSEncodedLiteralName, DNSEncodedName, encodeLabelHash } from "@ensnode/ensnode-sdk";

// Example TXT `record` representing key: 'com.twitter', value: '0xTko'
// via: https://optimistic.etherscan.io/tx/0xf32db67e7bf2118ea2c3dd8f40fc48d18e83a4a2317fbbddce8f741e30a1e8d7#eventlog
const { args } = decodeEventLog({
  abi: getDatasource("mainnet", "threedns-base").contracts.Resolver.abi,
  topics: [
    "0xaaac3b4b3e6807b5b4585562beabaa2de9bd07db514a1eba2c11d1af5b9d9dc7",
    "0x6470e2677db6a5bb6c69e51fce7271aeeb5f2808ea7dfdf34b703749555b3e10",
  ],
  data: "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e1000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001103636f6d077477697474657203656e7300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002103636f6d077477697474657203656e73000010000100000e100006053078546b6f00000000000000000000000000000000000000000000000000000000000000",
  eventName: "DNSRecordChanged",
});

const PARSED_KEY = "com.twitter";
const PARSED_VALUE = "0xTko";

const NON_SUBGRAPH_VALID_DNS_ENCODED_NAMES = [
  stringToHex("\x05test\0\x00"),
  stringToHex("\x05test.\x00"),
  stringToHex("\x05test[\x00"),
  stringToHex("\x05test]\x00"),
] as DNSEncodedLiteralName[];

const MULTI_BYTE_UNICODE_NAMES = ["👩🏼‍❤‍💋‍👨🏼.eth"];

describe("dns-helpers", () => {
  describe("parseRRSet", () => {
    it("correctly parses Hex RRSet to single TXT answer", () => {
      const answers = parseRRSet(args.record);
      expect(answers.length).toBe(1);
      expect(((answers[0] as TxtAnswer).data as Buffer[]).length).toBe(1);
    });

    it("correctly returns [] with empty record", () => {
      expect(parseRRSet("0x")).toStrictEqual([]);
    });

    it("correctly returns [] with malformed record", () => {
      expect(parseRRSet(zeroHash)).toStrictEqual([]);
    });
  });

  describe("decodeTXTData", () => {
    const DATA = (parseRRSet(args.record)[0] as TxtAnswer).data as Buffer[];
    it("correctly decodes TXT data", () => {
      expect(decodeTXTData(DATA)).toBe(PARSED_VALUE);
    });

    it("ignores multiple records", () => {
      expect(decodeTXTData([DATA[0]!, Buffer.from("")])).toBe(PARSED_VALUE);
    });

    it("returns null if no records", () => {
      expect(decodeTXTData([])).toBe(null);
    });
  });

  describe("subgraph_decodeDNSEncodedLiteralName", () => {
    it("throws for root node", () => {
      expect(() =>
        subgraph_decodeDNSEncodedLiteralName(
          bytesToHex(packetToBytes("")) as DNSEncodedLiteralName,
        ),
      ).toThrow(/root node/i);
    });

    it("throws for empty input", () => {
      expect(() => subgraph_decodeDNSEncodedLiteralName("" as DNSEncodedLiteralName)).toThrow(
        /empty/i,
      );
    });

    it("throws for empty packet", () => {
      expect(() => subgraph_decodeDNSEncodedLiteralName("0x" as DNSEncodedLiteralName)).toThrow(
        /empty/i,
      );
    });

    it("throws for malformed packet", () => {
      expect(() =>
        subgraph_decodeDNSEncodedLiteralName(stringToHex("\x06aaa\x00") as DNSEncodedLiteralName),
      ).toThrow(/overflow/i);
    });

    it("should throw for labels with subgraph-invalid characters", () => {
      NON_SUBGRAPH_VALID_DNS_ENCODED_NAMES.forEach((name) => {
        expect(() => subgraph_decodeDNSEncodedLiteralName(name)).toThrow(/not subgraph-valid/i);
      });
    });

    it("should handle previously bugged name", () => {
      // this `name` from tx 0x2138cdf5fbaeabc9cc2cd65b0a30e4aea47b3961f176d4775869350c702bd401
      expect(
        subgraph_decodeDNSEncodedLiteralName(
          "0x0831323333333232310365746800" as DNSEncodedLiteralName,
        ),
      ).toEqual({
        label: "12333221",
        name: "12333221.eth",
      });
    });
  });

  describe("parseDnsTxtRecordArgs", () => {
    it("should parse just key if no record", () => {
      expect(parseDnsTxtRecordArgs({ ...args, record: undefined })).toEqual({
        key: PARSED_KEY,
        value: null,
      });
    });

    it("should parse just key if empty record", () => {
      expect(parseDnsTxtRecordArgs({ ...args, record: "0x" })).toEqual({
        key: PARSED_KEY,
        value: null,
      });
    });

    it("should handle malformed record", () => {
      expect(parseDnsTxtRecordArgs({ ...args, record: zeroHash })).toEqual({
        key: PARSED_KEY,
        value: null,
      });
    });

    it("should parse args correctly", () => {
      expect(parseDnsTxtRecordArgs(args)).toEqual({ key: PARSED_KEY, value: PARSED_VALUE });
    });
  });

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
      expect(decodeDNSEncodedName(stringToHex("\x03aaa\x02bb\x01c\x00"))).toEqual([
        "aaa",
        "bb",
        "c",
      ]);
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
      console.log(bytesToHex(packetToBytes("example.eth")));
      MULTI_BYTE_UNICODE_NAMES.forEach((name) =>
        expect(decodeDNSEncodedName(bytesToHex(packetToBytes(name)))).toEqual(name.split(".")),
      );
    });
  });
});
