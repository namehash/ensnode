import { ByteArray } from "viem";

export function byteArraysEqual(a: ByteArray, b: ByteArray): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
} 
