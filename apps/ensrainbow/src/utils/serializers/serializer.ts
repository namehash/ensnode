import { createReadStream, createWriteStream, promises as fs } from "fs";
import { once } from "events";
import { Readable } from "stream";
import { RainbowRecord } from "@/utils/rainbow-record";

/**
 * Base class for all serializer implementations.
 * Provides common functionality for file handling.
 */
export abstract class BaseSerializer {
  protected filePath: string;
  protected writeStream: NodeJS.WritableStream | null = null;
  protected readStream: Readable | null = null;
  protected bufferStore: Buffer | null = null;
  protected remainingBuffer: Buffer | null = null;
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Opens a write stream to the output file
   */
  async openForWriting(): Promise<void> {
    this.writeStream = createWriteStream(this.filePath);
    await once(this.writeStream, 'open');
  }

  /**
   * Opens a read stream from the input file
   */
  async openForReading(): Promise<void> {
    this.readStream = createReadStream(this.filePath);
    await once(this.readStream, 'open');
    this.remainingBuffer = Buffer.alloc(0);
  }

  /**
   * Closes any open streams
   */
  async close(): Promise<void> {
    if (this.writeStream) {
      this.writeStream.end();
      await once(this.writeStream, 'close');
      this.writeStream = null;
    }
    
    if (this.readStream) {
      this.readStream.destroy();
      this.readStream = null;
    }
    
    this.remainingBuffer = null;
  }

  /**
   * Writes a buffer to the output file
   */
  protected async writeBuffer(buffer: Buffer | Uint8Array): Promise<void> {
    if (!this.writeStream) {
      await this.openForWriting();
    }
    
    // We need to prefix each record with its length for sequential reading
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(buffer.length, 0);
    
    const isOk = this.writeStream!.write(Buffer.concat([lengthBuffer, Buffer.from(buffer)]));
    
    if (!isOk) {
      // Wait for drain event if the buffer is full
      await once(this.writeStream!, 'drain');
    }
  }

  /**
   * Reads the next buffer from the input file
   */
  protected async readNextBuffer(): Promise<Buffer | null> {
    if (!this.readStream) {
      await this.openForReading();
    }
    
    // First ensure we have a read stream and a remaining buffer
    if (!this.readStream || this.remainingBuffer === null) {
      return null;
    }
    
    // Read more data if needed
    if (this.remainingBuffer.length < 4) {
      const chunks: Buffer[] = [];
      const [chunk] = await once(this.readStream, 'data');
      
      if (!chunk) {
        // End of file
        return null;
      }
      
      chunks.push(this.remainingBuffer, chunk);
      this.remainingBuffer = Buffer.concat(chunks);
      
      // Still not enough data
      if (this.remainingBuffer.length < 4) {
        return null;
      }
    }
    
    // Read the length prefix (first 4 bytes)
    const length = this.remainingBuffer.readUInt32BE(0);
    
    // Ensure we have enough data for the full record
    while (this.remainingBuffer.length < 4 + length) {
      try {
        const [chunk] = await once(this.readStream, 'data');
        if (!chunk) {
          // End of file
          return null;
        }
        this.remainingBuffer = Buffer.concat([this.remainingBuffer, chunk]);
      } catch (error) {
        // Stream ended or errored
        return null;
      }
    }
    
    // Extract the record data
    const recordBuffer = this.remainingBuffer.slice(4, 4 + length);
    
    // Update the remaining buffer
    this.remainingBuffer = this.remainingBuffer.slice(4 + length);
    
    return recordBuffer;
  }
  
  /**
   * Writes a single record to the output file
   */
  abstract writeRecord(record: RainbowRecord): Promise<void>;
  
  /**
   * Reads a single record from the input file
   * Returns null when there are no more records
   */
  abstract readRecord(): Promise<RainbowRecord | null>;
} 
