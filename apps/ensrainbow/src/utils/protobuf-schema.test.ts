import * as protobuf from "protobufjs";
import { describe, expect, it } from "vitest";

import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "./protobuf-schema";

describe("protobuf-schema", () => {
  describe("createRainbowProtobufRoot", () => {
    it("should create a valid protobuf root with expected types", () => {
      const { root, RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();

      // Check that the root was created
      expect(root).toBeDefined();

      // Check that the message types were created correctly
      expect(RainbowRecordType).toBeDefined();
      expect(RainbowRecordCollectionType).toBeDefined();

      // Verify field structure for RainbowRecord
      const recordFields = RainbowRecordType.fieldsArray;
      expect(recordFields).toHaveLength(2);
      expect(recordFields[0].name).toBe("labelhash");
      expect(recordFields[0].id).toBe(1);
      expect(recordFields[0].type).toBe("bytes");
      expect(recordFields[1].name).toBe("label");
      expect(recordFields[1].id).toBe(2);
      expect(recordFields[1].type).toBe("string");

      // Verify field structure for RainbowRecordCollection
      const collectionFields = RainbowRecordCollectionType.fieldsArray;
      expect(collectionFields).toHaveLength(5);
      expect(collectionFields[0].name).toBe("format_identifier");
      expect(collectionFields[0].id).toBe(1);
      expect(collectionFields[0].type).toBe("string");
      expect(collectionFields[1].name).toBe("ensrainbow_file_format_version");
      expect(collectionFields[1].id).toBe(2);
      expect(collectionFields[1].type).toBe("uint32");
      expect(collectionFields[2].name).toBe("label_set_id");
      expect(collectionFields[2].id).toBe(3);
      expect(collectionFields[2].type).toBe("string");
      expect(collectionFields[3].name).toBe("label_set_version");
      expect(collectionFields[3].id).toBe(4);
      expect(collectionFields[3].type).toBe("uint32");
      expect(collectionFields[4].name).toBe("records");
      expect(collectionFields[4].id).toBe(5);
      expect(collectionFields[4].type).toBe("RainbowRecord");
      // Check if the field is repeated (array)
      expect(collectionFields[4].repeated).toBe(true);
    });

    it("should be able to encode and decode a message", () => {
      const { RainbowRecordType } = createRainbowProtobufRoot();

      // Create a test message
      const testMessage = {
        labelhash: Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
        label: "test-label",
      };

      // Encode the message
      const message = RainbowRecordType.fromObject(testMessage);
      const buffer = RainbowRecordType.encode(message).finish();

      // Decode the message
      const decodedMessage = RainbowRecordType.decode(buffer);
      const decodedObject = RainbowRecordType.toObject(decodedMessage, {
        bytes: Buffer.from,
        arrays: true,
        objects: true,
      });

      // Verify the decoded message matches the original
      expect(Buffer.from(decodedObject.labelhash).toString("hex")).toBe(
        "0123456789abcdef0123456789abcdef",
      );
      expect(decodedObject.label).toBe("test-label");
    });

    it("should be able to encode and decode a collection with version", () => {
      const { RainbowRecordCollectionType } = createRainbowProtobufRoot();

      // Create a test collection
      const testCollection = {
        ensrainbow_file_format_version: CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
        label_set_id: "test-label-set-id",
        label_set_version: 42,
        records: [],
      };

      // Encode the collection
      const collection = RainbowRecordCollectionType.fromObject(testCollection);
      const buffer = RainbowRecordCollectionType.encode(collection).finish();

      // Decode the collection
      const decodedCollection = RainbowRecordCollectionType.decode(buffer);
      const decodedObject = RainbowRecordCollectionType.toObject(decodedCollection, {
        bytes: Buffer.from,
        arrays: true,
        objects: true,
      });

      // Verify the decoded collection matches the original
      expect(decodedObject.ensrainbow_file_format_version).toBe(
        CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
      );
      expect(decodedObject.label_set_id).toBe("test-label-set-id");
      expect(decodedObject.label_set_version).toBe(42);
      expect(decodedObject.records).toEqual([]);
    });

    it("should be able to encode and decode a delimited message", () => {
      const { RainbowRecordType } = createRainbowProtobufRoot();

      // Create a test message
      const testMessage = {
        labelhash: Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
        label: "test-label",
      };

      // Encode the message with delimited format (length-prefixed)
      const message = RainbowRecordType.fromObject(testMessage);
      const buffer = RainbowRecordType.encodeDelimited(message).finish();

      // Decode the delimited message
      const reader = protobuf.Reader.create(buffer);
      const decodedMessage = RainbowRecordType.decodeDelimited(reader);
      const decodedObject = RainbowRecordType.toObject(decodedMessage, {
        bytes: Buffer.from,
        arrays: true,
        objects: true,
      });

      // Verify the decoded message matches the original
      expect(Buffer.from(decodedObject.labelhash).toString("hex")).toBe(
        "0123456789abcdef0123456789abcdef",
      );
      expect(decodedObject.label).toBe("test-label");

      // Also verify that the length prefix is handled correctly
      expect(reader.pos).toBe(buffer.length);
    });

    it("should be able to read multiple delimited messages from a buffer", () => {
      const { RainbowRecordType } = createRainbowProtobufRoot();

      // Create two test messages
      const testMessage1 = {
        labelhash: Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
        label: "test-label-1",
      };

      const testMessage2 = {
        labelhash: Buffer.from("fedcba9876543210fedcba9876543210", "hex"),
        label: "test-label-2",
      };

      // Encode both messages with delimited format
      const message1 = RainbowRecordType.fromObject(testMessage1);
      const message2 = RainbowRecordType.fromObject(testMessage2);

      const buffer1 = RainbowRecordType.encodeDelimited(message1).finish();
      const buffer2 = RainbowRecordType.encodeDelimited(message2).finish();

      // Combine the buffers
      const combinedBuffer = Buffer.concat([Buffer.from(buffer1), Buffer.from(buffer2)]);

      // Read messages one by one
      const reader = protobuf.Reader.create(combinedBuffer);

      // Read first message
      const decodedMessage1 = RainbowRecordType.decodeDelimited(reader);
      const decodedObject1 = RainbowRecordType.toObject(decodedMessage1, {
        bytes: Buffer.from,
      });

      // Read second message
      const decodedMessage2 = RainbowRecordType.decodeDelimited(reader);
      const decodedObject2 = RainbowRecordType.toObject(decodedMessage2, {
        bytes: Buffer.from,
      });

      // Verify both messages were decoded correctly
      expect(Buffer.from(decodedObject1.labelhash).toString("hex")).toBe(
        "0123456789abcdef0123456789abcdef",
      );
      expect(decodedObject1.label).toBe("test-label-1");

      expect(Buffer.from(decodedObject2.labelhash).toString("hex")).toBe(
        "fedcba9876543210fedcba9876543210",
      );
      expect(decodedObject2.label).toBe("test-label-2");

      // Verify we've read the entire buffer
      expect(reader.pos).toBe(combinedBuffer.length);
    });
  });
});
