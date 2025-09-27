import { bytesToString, hexToBytes } from "viem";

import { DNSEncodedLiteralName, DNSEncodedName, LiteralLabel } from "./types";

/**
 * Decodes a DNS-Encoded name consisting of Literal Labels into an ordered list of Literal Labels.
 *
 * For discussion on DNS-Encoding, see the {@link DNSEncodedName} and {@link DNSEncodedLiteralName} types.
 *
 * Due to the constraints of DNS-Encoding, there is an additional guarantee that each Literal Label
 * in the resulting list is guaranteed to have a maximum byte length of 255.
 *
 * @param packet a hex string that encodes a DNSEncodedLiteralName
 * @returns A list of the LiteralLabels contained in packet
 * @throws If the packet is malformed
 * @dev This is just `decodeDNSEncodedName` with semantic input/output
 */
export function decodeDNSEncodedLiteralName(packet: DNSEncodedLiteralName): LiteralLabel[] {
  return decodeDNSEncodedName(packet) as LiteralLabel[];
}

/**
 * Decodes a DNS-Encoded Name into an ordered list of string segments.
 *
 * For discussion on DNS-Encoding, see the {@link DNSEncodedName} type.
 *
 * Due to the constraints of DNS-Encoding, there is an additional guarantee that each segment
 * in the resulting list is guaranteed to have a maximum byte length of 255.
 *
 * @param packet a hex string that encodes a DNSEncodedName
 * @returns A UTF-8 string array of the segments contained in packet
 * @throws If the packet is malformed
 * @dev This is the generic implementation of DNS-Encoded Name Decoding
 */
export function decodeDNSEncodedName(packet: DNSEncodedName): string[] {
  const segments: string[] = [];

  const bytes = hexToBytes(packet);
  if (bytes.length === 0) throw new Error(`Packet is empty.`);

  let offset = 0;
  while (offset < bytes.length) {
    // NOTE: `len` is always [0, 255] because ByteArray is array of unsigned 8-bit integers. Because
    // the length of the next label is limited to one unsigned byte, this is why labels with bytelength
    // greater than 255 cannot be DNS Encoded.
    const len = bytes[offset];

    // Invariant: the while conditional enforces that there's always _something_ in bytes at offset
    if (len === undefined) {
      throw new Error(`Invariant: bytes[offset] is undefined after offset < bytes.length check.`);
    }

    // Invariant: `len` is always [0, 255]. technically not necessary but good for clarity
    if (len < 0 || len > 255) {
      throw new Error(
        `Invariant: this should be literally impossible, but an unsigned byte was less than zero or greater than 255. The value in question is ${len}`,
      );
    }

    // stop condition
    if (len === 0) break;

    // decode to UTF-8 string
    const segment = bytesToString(bytes.subarray(offset + 1, offset + len + 1));

    // add to list of segments and continue decoding
    segments.push(segment);
    offset += len + 1;
  }

  // check for overflow
  if (offset >= bytes.length) throw new Error(`Overflow, offset >= bytes.length`);

  // check for junk
  if (offset !== bytes.length - 1) throw new Error(`Junk at end of name`);

  return segments;
}
