import {
  EncodedLslContract,
  type ListStorageLocationContract,
  ListStorageLocationType,
  ListStorageLocationVersion,
  decodeListStorageLocationContract,
  isEncodedLslContract,
  parseEncodedLsl,
  validateEncodedLslContract,
} from "@/plugins/efp/lib/lsl";
import { parseEvmAddress } from "@/plugins/efp/lib/utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { describe, expect, it } from "vitest";

describe("EFP List Storage Location", () => {
  describe("V1 EVMContract", () => {
    describe("decodeListStorageLocationContract", () => {
      it("should decode a valid V1 EVMContract List Storage Location for EFP mainnet", () => {
        const encodedLsl = parseEncodedLsl(
          "0x010100000000000000000000000000000000000000000000000000000000000000015289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
        );

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(
          decodeListStorageLocationContract(
            ENSNamespaceIds.Mainnet,
            encodedLsl as EncodedLslContract,
          ),
        ).toEqual({
          type: ListStorageLocationType.EVMContract,
          version: ListStorageLocationVersion.V1,
          chainId: 1,
          listRecordsAddress: parseEvmAddress("0x5289fe5dabc021d02fddf23d4a4df96f4e0f17ef"),
          slot: 31941687331316587819122038778003974753188806173854071805743471973008610429132n,
        } satisfies ListStorageLocationContract);
      });

      it("should decode a valid V1 EVMContract List Storage Location for EFP testnet", () => {
        const encodedLsl = parseEncodedLsl(
          "0x01010000000000000000000000000000000000000000000000000000000000014a345289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
        );

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(
          decodeListStorageLocationContract(
            ENSNamespaceIds.Sepolia,
            encodedLsl as EncodedLslContract,
          ),
        ).toEqual({
          type: ListStorageLocationType.EVMContract,
          version: ListStorageLocationVersion.V1,
          chainId: 84532,
          listRecordsAddress: parseEvmAddress("0x5289fe5dabc021d02fddf23d4a4df96f4e0f17ef"),
          slot: 31941687331316587819122038778003974753188806173854071805743471973008610429132n,
        } satisfies ListStorageLocationContract);
      });

      it("should output lowercase list record address", () => {
        const testListRecordsAddress = "5289fE5daBC021D02FDDf23d4a4DF96F4E0F17EF";
        const encodedLsl = parseEncodedLsl(
          `0x01010000000000000000000000000000000000000000000000000000000000000001${testListRecordsAddress}469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc`,
        );

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(
          decodeListStorageLocationContract(
            ENSNamespaceIds.Mainnet,
            encodedLsl as EncodedLslContract,
          ).listRecordsAddress,
        ).toEqual(`0x${testListRecordsAddress.toLowerCase()}`);
      });

      it("should not decode encoded LSL when chainId value is out of bounds (too small)", () => {
        const encodedLsl = parseEncodedLsl(
          "0x0101000000000000000000000000000000000000000000000000000000000000000041aa48ef3c0446b46a5b1cc6337ff3d3716e2a33073b78bf041b622ff5f1b972b5839062cbe5ab0efb4917745873e00305d7c0cb",
        ) as EncodedLslContract;

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(() =>
          decodeListStorageLocationContract(
            ENSNamespaceIds.Mainnet,
            encodedLsl as EncodedLslContract,
          ),
        ).toThrowError(`Failed to decode the encoded List Storage Location contract object: 
✖ chainId must be in the accepted range
  → at chainId
✖ chainId must be one of the EFP deployment Chain IDs defined for the ENSNamespace "mainnet": 8453, 10, 1
  → at chainId
`);
      });

      it("should not decode encoded LSL when chainId value is out of bounds (too large)", () => {
        const encodedLsl = parseEncodedLsl(
          "0x0101000000000000000000000000000000000000000000000000002000000000000041aa48ef3c0446b46a5b1cc6337ff3d3716e2a33073b78bf041b622ff5f1b972b5839062cbe5ab0efb4917745873e00305d7c0cb",
        );

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(() =>
          decodeListStorageLocationContract(
            ENSNamespaceIds.Mainnet,
            encodedLsl as EncodedLslContract,
          ),
        ).toThrowError(`Failed to decode the encoded List Storage Location contract object: 
✖ chainId must be in the accepted range
  → at chainId
✖ chainId must be one of the EFP deployment Chain IDs defined for the ENSNamespace "mainnet": 8453, 10, 1
  → at chainId
`);
      });

      it("should not decode encoded LSL when chainId value is not allowlisted for EFP mainnet", () => {
        const encodedLsl = parseEncodedLsl(
          "0x0101000000000000000000000000000000000000000000000000001fffffffffffff41aa48ef3c0446b46a5b1cc6337ff3d3716e2a33073b78bf041b622ff5f1b972b5839062cbe5ab0efb4917745873e00305d7c0cb",
        );

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(() =>
          decodeListStorageLocationContract(
            ENSNamespaceIds.Mainnet,
            encodedLsl as EncodedLslContract,
          ),
        ).toThrowError(`Failed to decode the encoded List Storage Location contract object: 
✖ chainId must be one of the EFP deployment Chain IDs defined for the ENSNamespace "mainnet": 8453, 10, 1
  → at chainId
`);
      });

      it("should not decode encoded LSL when chainId value is not allowlisted for EFP testnet", () => {
        const encodedLsl = parseEncodedLsl(
          "0x0101000000000000000000000000000000000000000000000000001fffffffffffff41aa48ef3c0446b46a5b1cc6337ff3d3716e2a33073b78bf041b622ff5f1b972b5839062cbe5ab0efb4917745873e00305d7c0cb",
        ) as EncodedLslContract;

        expect(isEncodedLslContract(encodedLsl)).toBe(true);

        expect(() =>
          decodeListStorageLocationContract(ENSNamespaceIds.Sepolia, encodedLsl),
        ).toThrowError(`Failed to decode the encoded List Storage Location contract object: 
✖ chainId must be one of the EFP deployment Chain IDs defined for the ENSNamespace "sepolia": 84532, 11155420, 11155111
  → at chainId
`);
      });

      it("should not decode encoded LSL when `version` is different than 1", () => {
        const encodedLsl = parseEncodedLsl(
          "0x020100000000000000000000000000000000000000000000000000000000000000015289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
        ) as EncodedLslContract;

        expect(() =>
          decodeListStorageLocationContract(ENSNamespaceIds.Mainnet, encodedLsl),
        ).toThrowError(
          `Failed to decode the encoded List Storage Location contract object: 
✖ Invalid input: expected "01"
  → at version`,
        );
      });

      it("should not decode encoded LSL when `type` field is different than 1 (EVM Contract)", () => {
        const encodedLsl = parseEncodedLsl(
          "0x010200000000000000000000000000000000000000000000000000000000000000015289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
        ) as EncodedLslContract;

        expect(() =>
          decodeListStorageLocationContract(ENSNamespaceIds.Mainnet, encodedLsl),
        ).toThrowError(
          `Failed to decode the encoded List Storage Location contract object: 
✖ Invalid input: expected "01"
  → at type`,
        );
      });

      it("should not decode encoded LSL when the value is not of the expected length", () => {
        const encodedLsl = parseEncodedLsl("0xa22cb465");

        expect(isEncodedLslContract(encodedLsl)).toBe(false);
      });
    });
  });

  describe("parseEncodedLsl", () => {
    it("should normalize a valid encoded LSL", () => {
      const encodedLsl = "0xAbCD123";
      expect(parseEncodedLsl(encodedLsl)).toBe("0xabcd123");
    });

    it("should throw an error if value was not a hex string", () => {
      const invalidEncodedLsl = "not-a-hex-string";
      expect(() => parseEncodedLsl(invalidEncodedLsl)).toThrowError(
        `Encoded LSL must start with '0x'`,
      );
    });
  });

  describe("validateEncodedLslContract", () => {
    it("should not throw any error for a valid encoded V1 EVMContract LSL", () => {
      const encodedLsl = parseEncodedLsl(
        "0x010100000000000000000000000000000000000000000000000000000000000000015289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
      );

      expect(() => validateEncodedLslContract(encodedLsl)).to.not.Throw();
      expect(isEncodedLslContract(encodedLsl)).toBe(true);
    });

    it("should throw an error when encoded LSL was not of expected length", () => {
      const encodedLsl = parseEncodedLsl("0x010100");

      expect(() => validateEncodedLslContract(encodedLsl)).toThrowError(
        `Encoded List Storage Location values for a LSL v1 Contract must be a 174-character long string`,
      );
      expect(isEncodedLslContract(encodedLsl)).toBe(false);
    });

    it("should throw an error when encoded LSL was not of expected type", () => {
      const encodedLsl = parseEncodedLsl(
        "0x010200000000000000000000000000000000000000000000000000000000000000015289fe5dabc021d02fddf23d4a4df96f4e0f17ef469e5ab72064e89164e9792a7f05d5bc073c2dfb1bb6da7b801e1bb2192808cc",
      );

      expect(() => validateEncodedLslContract(encodedLsl)).toThrowError(
        `Encoded List Storage Location type value for an EVMContract LSL must be set to 01`,
      );
      expect(isEncodedLslContract(encodedLsl)).toBe(false);
    });
  });
});
