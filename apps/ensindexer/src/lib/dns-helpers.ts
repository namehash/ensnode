import dnsPacket, { Answer } from "dns-packet";
import { Hex } from "viem";

import { isLabelSubgraphIndexable } from "@/lib/is-label-subgraph-indexable";
import { stripNullBytes } from "@/lib/lib-helpers";
import {
  DNSEncodedLiteralName,
  DNSEncodedName,
  Label,
  Name,
  SubgraphInterpretedLabel,
  SubgraphInterpretedName,
  decodeDNSEncodedLiteralName,
  decodeDNSEncodedName,
  literalLabelsToLiteralName,
} from "@ensnode/ensnode-sdk";

/**
 * Implements the original ENS Subgraph DNS-Encoded Name decoding logic, in particular the additional
 * check that each label in the decoded name is subgraph-indexable (see {@link isLabelSubgraphIndexable}).
 *
 * NOTE(subgraph-compat): This behavior is required when config.replaceUnnormalized = false in order
 * to match the output of the legacy ENS Subgraph.
 *
 * @param packet a hex string that encodes a DNSEncodedLiteralName
 * @returns The Literal Label and Literal Name that the LiteralDNSEncodeName decodes to
 * @throws If the packet is malformed, the packet encodes the root node, or if any of the labels are not subgraph-indexable.
 */
export function subgraph_decodeDNSEncodedLiteralName(packet: DNSEncodedLiteralName): {
  label: SubgraphInterpretedLabel;
  name: SubgraphInterpretedName;
} {
  // decode the literal labels as normal, throwing if malformed
  const literalLabels = decodeDNSEncodedLiteralName(packet);

  // NOTE: in the original implementation, the returned `label`, in the case of the root node, would
  // be '' (empty string). In practice, however, the root node is never wrapped by the NameWrapper,
  // and this condition never occurs. To enhance the clarity of this function, we encode that
  // implicit invariant here.
  if (literalLabels.length === 0) {
    throw new Error(
      `Implicit Invariant(subgraph_decodeDNSEncodedLiteralName): NameWrapper emitted ${packet} that decoded to root node (empty string).`,
    );
  }

  // additionally require that every literal label is subgraph-indexable
  if (!literalLabels.every(isLabelSubgraphIndexable)) {
    throw new Error(
      `Some decoded literal labels were not subgraph-indexable: [${literalLabels.join(", ")}].`,
    );
  }

  // the label and name are Subgraph Interpreted by virtue of being a subgraph-indexable Literal Label/Name
  return {
    label: literalLabels[0]! as Label as SubgraphInterpretedLabel, // ! ok due to length invariant above,
    name: literalLabelsToLiteralName(literalLabels) as Name as SubgraphInterpretedName,
  };
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
  if (key === "") return { key: null, value: null };

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
