import msgpack from "msgpack-lite";
import { ByteArray } from "viem";

import { RainbowRecord } from "@/utils/rainbow-record";
import { BaseSerializer } from "./serializer";

export class MsgPackSerializer extends BaseSerializer {
  constructor(outputFilePath: string) {
    super(outputFilePath);
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    // In MsgPack, we can directly serialize the object
    const encoded = msgpack.encode({
      labelHash: Array.from(record.labelHash),
      label: record.label,
    });

    await this.writeBuffer(encoded);
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      const buffer = await this.readNextBuffer();
      if (!buffer) return null;

      const decoded = msgpack.decode(buffer);
      return {
        labelHash: new Uint8Array(decoded.labelHash) as ByteArray,
        label: decoded.label,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("EOF")) {
        return null;
      }
      throw error;
    }
  }
}
