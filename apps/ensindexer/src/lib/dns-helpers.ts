import dnsPacket, { Answer } from "dns-packet";
import { Hex, bytesToHex, bytesToString, hexToBytes, stringToBytes } from "viem";

import { stripNullBytes } from "@/lib/lib-helpers";
import { type Label, type Name, isLabelIndexable } from "@ensnode/ensnode-sdk";

/**
 * Given a Buffer representing a DNS Packet that encodes a domain name, decodes the domain name into
 * [Label, Name] where the first return parameter is the first Label in the Name, and the second is
 * the full domain name. If decoding fails, [null, null] is returned.
 *
 * ex: if the input DNS Packet represents `example.eth`, the output will be ['example', 'example.eth']
 *
 * ---
 *
 * DNS Packet Format for Domain Names:
 * - Domain names are encoded as a sequence of labels
 * - Each label begins with a length byte (1 byte) indicating how many bytes follow for that label
 * - The bytes after the length byte represent the characters in the label
 * - Labels are concatenated with no separators
 * - The sequence ends with a zero-length byte (0x00)
 *
 * Example: "example.eth" is encoded as:
 * [0x07, 'e', 'x', 'a', 'm', 'p', 'l', 'e', 0x03, 'e', 't', 'h', 0x00]
 * Where 0x07 is the length of "example", 0x03 is the length of "eth", and 0x00 marks the end
 *
 * The decoding process:
 * 1. Read the length byte
 * 2. Extract the label using that length
 * 3. Append a dot if not the first label
 * 4. Repeat until a zero-length byte is encountered
 *
 * ---
 *
 * NOTE: there seems to be a bug in ensjs#bytesToPacket, which we were originally using for this
 * implementation, regarding malformed names.
 *
 * For example, in this tx `0x4ece50ae828f2a0f27f45d086e85a55e6284bff31a0a89daca9df4b1b1f5cb75` the
 * `name` input is `8436.eth` (it should have been just `8436`, as the `.eth` is inferred).
 *
 * This operates against a name that actually looks like `[fb1d24d5dc41613d5b4874e6cccb06ecf442f6f1773c3771c4fcce1161985a18].eth`
 * which results in a namehash of `0xfb1d24d5dc41613d5b4874e6cccb06ecf442f6f1773c3771c4fcce1161985a18`
 * and the NameWrapper emits an event with the packet bytes of `08383433362E6574680365746800`.
 * when ensjs#bytesToPacket sees these bytes, it returns a name of `8436.eth.eth`, which is incorrect.
 *
 * The original subgraph logic handled this case correctly, it seems, and so we re-implement it here.
 * https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L30
 *
 * More information about this discussion can be found in this thread:
 * https://github.com/namehash/ensnode/issues/36
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/staging/contracts/utils/NameCoder.sol
 *
 * TODO: replace this function with ensjs#bytesToPacket when it correctly handles these cases. See
 * ensnode commit hash bace0ab55077d9f5cd37bd9d6638c4acb16334a8 for an example implementation.
 *
 * @returns [(first) Label, Name] if decoding succeeded, otherwise [null, null]
 */
export function decodeDNSPacketBytes(buf: Uint8Array): [Label, Name] | [null, null] {
  // buffer is empty, bail
  if (buf.length === 0) return [null, null];

  let offset = 0;
  let list = new Uint8Array(0);
  let dot = stringToBytes(".");
  let len = buf[offset++];
  let hex = bytesToHex(buf);
  let firstLabel = "";

  // if the length of the first label is 0, this packet doesn't represent anything, so bail
  if (len === 0) return [null, null]; // NOTE: we return [null, null] instead of ["", "."]

  // while there are more labels to decode...
  while (len) {
    // grab the characters that represent that label
    const label = hex.slice((offset + 1) * 2, (offset + 1 + len) * 2);
    const labelBytes = Buffer.from(label, "hex");

    // if the decoded label is not indexable, bail
    if (!isLabelIndexable(labelBytes.toString())) return [null, null];

    if (offset > 1) {
      // if this is not the first label, append a dot to the current list of labels
      list = concatUint8Arrays(list, dot);
    } else {
      // this is the first decoded label, set firstLabel
      firstLabel = labelBytes.toString();
    }

    // add the decoded label to the list of decoded labels
    list = concatUint8Arrays(list, labelBytes);

    // forward offset to the character that represents the length of the next label
    offset += len;
    // decode that length and iterate
    len = buf[offset++];

    // NOTE: if this is the last label, the final 0x00 sets `len` to 0 and therefore breaks the loop
  }

  // finally, return the firstLabel and the set of labels and dots as a string
  return [firstLabel, bytesToString(list)];
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const concatenatedArray = new Uint8Array(a.length + b.length);
  concatenatedArray.set(a);
  concatenatedArray.set(b, a.length);
  return concatenatedArray;
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

export function encodeDNSPacketBytes(value: string) {
  const parts = value.split(".");
  const encodedParts = parts.map((part) => {
    const partBuffer = Buffer.from(part);
    return Buffer.concat([Buffer.from([partBuffer.length]), partBuffer]);
  });

  return Buffer.concat([...encodedParts, Buffer.from([0])]);
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
  name: Hex;
  resource: number;
  record?: Hex;
}): { key: string | null; value: string | null } {
  // we only index TXT records (resource id 16)
  if (resource !== 16) return { key: null, value: null };

  // parse the record's name, which is the key of the DNS record
  const [, recordName] = decodeDNSPacketBytes(hexToBytes(name));

  // invariant: recordName is always available and parsed correctly
  if (!recordName) {
    throw new Error(`parseDNSRecordArgs: Invalid DNSPacket, cannot parse name '${name}'.`);
  }

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
