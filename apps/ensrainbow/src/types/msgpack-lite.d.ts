declare module "msgpack-lite" {
  export function encode(data: any): Buffer;
  export function decode(buffer: Buffer): any;
  export function createEncodeStream(options?: any): NodeJS.ReadWriteStream;
  export function createDecodeStream(options?: any): NodeJS.ReadWriteStream;
}
