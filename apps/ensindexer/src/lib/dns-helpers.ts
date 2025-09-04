import dnsPacket, { Answer } from "dns-packet";
import { Hex, bytesToString, hexToBytes } from "viem";

import { stripNullBytes } from "@/lib/lib-helpers";
import {
  DNSEncodedName,
  LiteralDNSEncodedName,
  LiteralLabel,
  LiteralName,
  isLabelIndexable,
  literalLabelsToLiteralName,
} from "@ensnode/ensnode-sdk";

/**
 * Implements the original ENS Subgraph DNS-Encoded Name decoding logic, in particular the additional
 * check that each label in the decoded name is indexable (see `isLabelIndexable` for context).
 *
 * @param packet a hex string that encodes a LiteralDNSEncodedName
 * @returns The Literal Label and Literal Name that the LiteralDNSEncodeName decodes to
 * @throws If the packet is malformed, the packet encodes the root node, or if any of the labels are not indexable.
 */
export function subgraph_decodeLiteralDNSEncodedName(packet: LiteralDNSEncodedName): {
  label: LiteralLabel;
  name: LiteralName;
} {
  // decode the literal labels as normal
  const literalLabels = decodeLiteralDNSEncodedName(packet);

  // NOTE: in the original implementation, the returned `label`, in the case of the root node, would
  // be '' (empty string). In practice, however, the root node is never wrapped by the NameWrapper,
  // and this condition never occurs. To enhance the clarity of this function, we encode that
  // implicit invariant here.
  if (literalLabels.length === 0) {
    throw new Error(
      `Implicit Invariant(subgraph_decodeLiteralDNSEncodedName): NameWrapper emitted ${packet} that decoded to root node (empty string).`,
    );
  }

  // additionally require that every literal label is indexable
  if (!literalLabels.every(isLabelIndexable)) {
    throw new Error(
      `Some decoded literal labels were not indexable: [${literalLabels.join(", ")}].`,
    );
  }

  return {
    label: literalLabels[0]!, // ! ok due to length invariant above,
    name: literalLabelsToLiteralName(literalLabels),
  };
}

/**
 * Decodes a DNS-Encoded name consisting of Literal Labels into an ordred list of Literal Labels.
 *
 * For discussion on DNS-Encoding, see the {@link DNSEncodedName} and {@link LiteralDNSEncodedName} types.
 *
 * Due to the constraints of DNS-Encoding, there is an additional guarantee that each Literal Label
 * in the resulting list is guaranteed to have a maximum byte length of 255.
 *
 * @param packet a hex string that encodes a LiteralDNSEncodedName
 * @returns A list of the LiteralLabels contained in packet.
 * @throws If the packet is malformed
 * @dev This is just `decodeDNSEncodedPacket` with semantic input/output
 */
export function decodeLiteralDNSEncodedName(packet: LiteralDNSEncodedName): LiteralLabel[] {
  return decodeDNSEncodedName(packet) as LiteralLabel[];
}

/**
 * Decodes a DNS-Encoded Name into an ordred list of string segments.
 *
 * For discussion on DNS-Encoding, see the {@link DNSEncodedName} type.
 *
 * Due to the constraints of DNS-Encoding, there is an additional guarantee that each segment
 * in the resulting list is guaranteed to have a maximum byte length of 255.
 *
 * @param packet a hex string that encodes a DNSEncodedName
 * @returns A list of the segments contained in packet.
 * @throws If the packet is malformed
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

    // add to list of segments
    segments.push(bytesToString(bytes.subarray(offset + 1, offset + len + 1)));

    // continue
    offset += len + 1;
  }

  // check for overflow
  if (offset >= bytes.length) throw new Error(`Overflow, offset >= bytes.length`);

  // check for junk
  if (offset !== bytes.length - 1) throw new Error(`Junk at end of name`);

  return segments;
}

/**
 * parses an RRSet encoded as Hex string into a set of Answer records.
 *
 * the only relevant node library capable of this seems to be dns-packet, and its un-exported
 * `answers.decode` function, which we leverage here.
 *
 * @param record the hex representation of an RRSet
 */
export function parseRRSet(record: Hex) {
  const data = Buffer.from(record.slice(2), "hex");

  let offset = 0;
  const decodedRecords: Answer[] = [];

  // an RRSet is simply a concatenated set of encoded `Answer` records. to parse them, we use the
  // dnsPacket.answer.decode function, which accepts an offset in a Buffer to start decoding from.
  // if it is able to decode a valid Answer, it returns that `Answer`. We then determine how many
  // bytes we consumed by that Answer (`encodingLength`) and forward the `offset` by that amount.
  // By iterating until dnsPacket.answer.decode fails to decode, or we run out of data to decode,
  // we can extract the entire set of `Answer`s encoded in the record Buffer.
  while (offset < data.length) {
    let answer: Answer | undefined;
    try {
      answer = (dnsPacket as any).answer.decode(data, offset);
    } catch {}

    // if decode threw or returned undefined, break
    if (!answer) break;
    // if decode returned type of UNKNOWN_0 (malformed RRSet), break
    if ((answer.type as string) === "UNKNOWN_0") break;

    const consumedLength = (dnsPacket as any).answer.encodingLength(answer);

    // consumed length is 0, done
    if (consumedLength === 0) break;

    // finally, we have a valid decoded answer, include in response set
    decodedRecords.push(answer);

    // continue
    offset += consumedLength;
  }

  return decodedRecords;
}

export function decodeTXTData(data: Buffer[]): string | null {
  // decode to string
  const decoded = data.map((buf) => buf.toString());

  // soft-invariant: we never receive 0 data results in a TXT record
  if (decoded.length === 0) {
    console.warn(`decodeTXTData zero 'data' results, this is unexpected.`);
    return null;
  }

  // soft-invariant: we never receive more than 1 data result in a TXT record
  if (decoded.length > 1) {
    console.warn(
      `decodeTXTData received multiple 'data' results, this is unexpected. data = '${decoded.join(",")}'`,
    );
  }

  return decoded[0]!; // guaranteed to exist due to length check above
}

export function parseDnsTxtRecordArgs({
  name,
  resource,
  record,
}: {
  name: DNSEncodedName;
  resource: number;
  record?: Hex;
}): { key: string | null; value: string | null } {
  // we only index TXT records (resource id 16)
  if (resource !== 16) return { key: null, value: null };

  // parse the record's name, which is the key of the DNS record
  // Invariant: recordName is always available and parsed correctly (`decodeDNSEncodedName` throws)
  const recordName = decodeDNSEncodedName(name).join(".");

  // relevant keys end with .ens
  if (!recordName.endsWith(".ens")) return { key: null, value: null };

  // trim the .ens off the end to match ENS record naming
  const key = recordName.slice(0, -4);

  if (!record) return { key, value: null };

  // parse the `record` parameter, which is an RRSet describing the value of the DNS record
  const answers = parseRRSet(record);

  const txtDatas = answers
    .filter((answer) => answer.type === "TXT")
    .map((answer) => {
      // > When decoding, the return value will always be an array of Buffer.
      // https://github.com/mafintosh/dns-packet
      return decodeTXTData(answer.data as Buffer[]);
    });

  if (txtDatas.length === 0) {
    // no txt answers??
    console.warn(`parseDNSRecordArgs: No TXT answers found in DNS record for key '${key}'`);
    // TODO: should be invariant?
    return { key, value: null };
  }

  if (txtDatas.length > 1) {
    console.warn(
      `parseDNSRecordArgs: received multiple TXT answers, this is unexpected. answers = '${txtDatas.join(",")}'. Only using the first one.`,
    );
  }

  const value = txtDatas[0]!;

  // TODO(null-bytes): correctly represent null bytes here
  const sanitizedKey = stripNullBytes(key) || null;
  const sanitizedValue = stripNullBytes(value) || null;

  // return sanitized key, value to consumers
  return { key: sanitizedKey, value: sanitizedValue };
}
