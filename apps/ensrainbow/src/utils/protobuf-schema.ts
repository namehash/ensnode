import protobuf from "protobufjs";

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
  RainbowRecord.add(new protobuf.Field("label_hash", 1, "bytes"));
  RainbowRecord.add(new protobuf.Field("label", 2, "string"));
  
  // Define the RainbowRecordCollection message type as a Type
  const RainbowRecordCollection = new protobuf.Type("RainbowRecordCollection");
  RainbowRecordCollection.add(new protobuf.Field("records", 1, "RainbowRecord", "repeated"));
  
  // Add types to the root
  root.add(RainbowRecord);
  root.add(RainbowRecordCollection);
  
  // Lookup the actual types for use with the API
  const RainbowRecordType = root.lookupType("RainbowRecord");
  const RainbowRecordCollectionType = root.lookupType("RainbowRecordCollection");
  
  return {
    root,
    RainbowRecordType,
    RainbowRecordCollectionType
  };
} 
