import { BinarySerializer } from "./binary-serializer";
import { CapnProtoSerializer } from "./capnp-serializer";
import { FlatBuffersSerializer } from "./flatbuffers-serializer";
import { MsgPackSerializer } from "./msgpack-serializer";
import { ProtobufSerializer } from "./protobuf-serializer";
import { BaseSerializer } from "./serializer";

/**
 * Format options for the serializer
 */
export enum SerializationFormat {
  MsgPack = "msgpack",
  Protobuf = "protobuf",
  FlatBuffers = "flatbuffers",
  CapnProto = "capnproto",
  Binary = "binary",
}

/**
 * Creates a serializer for the specified format
 * @param format The serialization format to use
 * @param outputFilePath The path to the output file
 * @returns A serializer for the specified format
 */
export function createSerializer(
  format: SerializationFormat,
  outputFilePath: string,
): BaseSerializer {
  switch (format) {
    case SerializationFormat.MsgPack:
      return new MsgPackSerializer(outputFilePath);
    case SerializationFormat.Protobuf:
      return new ProtobufSerializer(outputFilePath);
    case SerializationFormat.FlatBuffers:
      return new FlatBuffersSerializer(outputFilePath);
    case SerializationFormat.CapnProto:
      return new CapnProtoSerializer(outputFilePath);
    case SerializationFormat.Binary:
      return new BinarySerializer(outputFilePath);
    default:
      throw new Error(`Unsupported serialization format: ${format}`);
  }
}
