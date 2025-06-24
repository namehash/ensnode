import { describe, expect, it } from "vitest";

import { decodeDNSPacketBytes, decodeTXTData, parseRRSet } from "@/lib/dns-helpers";
import { ENSNamespaceId, getDatasource } from "@ensnode/datasources";
import { TxtAnswer } from "dns-packet";
import { decodeEventLog, hexToBytes, toBytes, zeroHash } from "viem";

// Example TXT `record` representing key: 'com.twitter', value: '0xTko'
// via: https://optimistic.etherscan.io/tx/0xf32db67e7bf2118ea2c3dd8f40fc48d18e83a4a2317fbbddce8f741e30a1e8d7#eventlog
const {
  args: { record },
} = decodeEventLog({
  abi: getDatasource(ENSNamespaceId.Mainnet, "threedns-base").contracts.Resolver.abi,
  topics: [
    "0xaaac3b4b3e6807b5b4585562beabaa2de9bd07db514a1eba2c11d1af5b9d9dc7",
    "0x6470e2677db6a5bb6c69e51fce7271aeeb5f2808ea7dfdf34b703749555b3e10",
  ],
  data: "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e1000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001103636f6d077477697474657203656e7300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002103636f6d077477697474657203656e73000010000100000e100006053078546b6f00000000000000000000000000000000000000000000000000000000000000",
  eventName: "DNSRecordChanged",
});

describe("dns-helpers", () => {
  describe("parseRRSet", () => {
    it("correctly parses Hex RRSet to single TXT answer", () => {
      const answers = parseRRSet(record);
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
    const DATA = (parseRRSet(record)[0] as TxtAnswer).data as Buffer[];
    it("correctly decodes TXT data", () => {
      expect(decodeTXTData(DATA)).toBe("0xTko");
    });

    it("ignores multiple records", () => {
      expect(decodeTXTData([DATA[0]!, Buffer.from("")])).toBe("0xTko");
    });

    it("returns null if no records", () => {
      expect(decodeTXTData([])).toBe(null);
    });
  });

  describe("decodeDNSPacketBytes", () => {
    it("should return [null, null] for empty buffer", () => {
      expect(decodeDNSPacketBytes(new Uint8Array())).toEqual([null, null]);
      expect(decodeDNSPacketBytes(toBytes(""))).toEqual([null, null]);
    });

    it("should return [null, null] for malformed dns packet", () => {
      expect(decodeDNSPacketBytes(new Uint8Array([0x00]))).toEqual([null, null]);
    });

    it("should return [null, null] for labels with unindexable characters", () => {
      expect(decodeDNSPacketBytes(toBytes("test\0"))).toEqual([null, null]);
      expect(decodeDNSPacketBytes(toBytes("test."))).toEqual([null, null]);
      expect(decodeDNSPacketBytes(toBytes("test["))).toEqual([null, null]);
      expect(decodeDNSPacketBytes(toBytes("test]"))).toEqual([null, null]);
    });

    it("should handle previously bugged name", () => {
      // this `name` from tx 0x2138cdf5fbaeabc9cc2cd65b0a30e4aea47b3961f176d4775869350c702bd401
      expect(decodeDNSPacketBytes(hexToBytes("0x0831323333333232310365746800"))).toEqual([
        "12333221",
        "12333221.eth",
      ]);
    });
  });
});
