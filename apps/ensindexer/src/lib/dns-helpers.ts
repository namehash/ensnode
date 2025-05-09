import dnsPacket, { Answer } from "dns-packet";
import { Hex } from "viem";

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
    const answer = (dnsPacket as any).answer.decode(data, offset) as Answer;
    if (!answer) break; // decode failed, break

    const consumedLength = (dnsPacket as any).answer.encodingLength(answer);

    // consumed length is 0, done
    if (consumedLength === 0) break;

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
    console.warn(
      `decodeTXTData received multiple 'data' results, this is unexpected. ${decoded.join(",")}`,
    );
    return null;
  }

  // soft-invariant: we never receive more than 1 data result in a TXT record
  if (decoded.length > 1) {
    console.warn(
      `decodeTXTData received multiple 'data' results, this is unexpected. ${decoded.join(",")}`,
    );
  }

  return decoded[0]!; // guaranteed to exist due to length check above
}
