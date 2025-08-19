import protobuf from "protobufjs";

// Current .ensrainbow protobuf file format version
export const CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION = 1;

/**
 * Creates and returns protobuf message types for rainbow records
 */
export function createRainbowProtobufRoot(): {
  root: protobuf.Root;
  RainbowRecordType: protobuf.Type;
  RainbowRecordCollectionType: protobuf.Type;
} {
  // Create a new protobuf root
  const root = new protobuf.Root();

  // Define the RainbowRecord message type as a Type
  const RainbowRecord = new protobuf.Type("RainbowRecord");
  RainbowRecord.add(new protobuf.Field("labelhash", 1, "bytes"));
  RainbowRecord.add(new protobuf.Field("label", 2, "string"));

  // Define the RainbowRecordCollection message type as a Type
  const RainbowRecordCollection = new protobuf.Type("RainbowRecordCollection");
  // This version refers to the schema of the .ensrainbow protobuf file itself.
  // It is distinct from DB_SCHEMA_VERSION, which versions the physical LevelDB database schema.
  RainbowRecordCollection.add(new protobuf.Field("format_identifier", 1, "string"));
  RainbowRecordCollection.add(new protobuf.Field("ensrainbow_file_format_version", 2, "uint32"));
  RainbowRecordCollection.add(new protobuf.Field("label_set_id", 3, "string"));
  RainbowRecordCollection.add(new protobuf.Field("label_set_version", 4, "uint32"));
  RainbowRecordCollection.add(new protobuf.Field("records", 5, "RainbowRecord", "repeated"));

  // Add types to the root
  root.add(RainbowRecord);
  root.add(RainbowRecordCollection);

  // Lookup the actual types for use with the API
  const RainbowRecordType = root.lookupType("RainbowRecord");
  const RainbowRecordCollectionType = root.lookupType("RainbowRecordCollection");

  return {
    root,
    RainbowRecordType,
    RainbowRecordCollectionType,
  };
}
