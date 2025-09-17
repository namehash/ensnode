import { asLowerCaseAddress } from "@ensnode/ensnode-sdk";
import { type Address, type Hash, type Hex, isAddress } from "viem";

/**
 * Options for the `callTracer` tracer. This tracer is used to enlist
 * all internal calls made during a transaction.
 *
 * @link https://geth.ethereum.org/docs/developers/evm-tracing/built-in-tracers#call-tracer
 */
type CallTracerOptions = {
  tracer: "callTracer";
  tracerConfig?: {
    // Instructs the tracer to only process the main (top-level) call and none
    // of the sub-calls. This avoids extra processing for each call frame
    // if only the top-level call info are required.
    // Default: false
    onlyTopCall?: boolean;
  };
};

/**
 * Schema for the `debug_traceTransaction` method to be called with Ponder RPC client.
 * This schema defines the parameters and return type.
 *
 * @see https://viem.sh/docs/contract/tracing.html#tracetransaction
 */
export type DebugTraceTransactionSchema = {
  Parameters: [
    // Hash of the transaction to be traced
    hash: Hash,
    // Options for the call tracer
    options: CallTracerOptions,
  ];
  ReturnType: Trace;
};

interface Trace {
  // Type of the call
  type: "CALL" | "STATICCALL" | "DELEGATECALL" | "CREATE" | "CREATE2";

  // Caller address
  from: Address;

  // Recipient address
  to: Address;

  // Amount of gas provided for the call
  gas: Hex;

  // Amount of gas used during the call
  gasUsed: Hex;

  // Call data
  input: Hash;

  // Return data
  output?: Hash;

  // Amount of value included in the transfer
  value?: Hex;

  // Array of sub-calls made within the transaction
  calls?: ReadonlyArray<Trace>;
}

/**
 * Extracts all Ethereum addresses from a given transaction trace.
 *
 * @param trace The transaction trace to extract addresses from
 * @returns An array of unique addresses found in the trace.
 */
export function getAddressesFromTrace(trace: Trace): Set<Address> {
  const text = JSON.stringify(trace);
  const uniqueAddresses = new Set<Address>();

  // Helper function to search for plain addresses (0x followed by 40 hex characters)
  const searchForPlainAddresses = (text: string) => {
    // Looking for 0x followed by exactly 40 hex characters
    const regex = /\b0x[a-fA-F0-9]{40}\b/gi;

    // Find all matches
    const matches = text.match(regex);

    // if matches are found, normalize them and return unique addresses
    if (matches) {
      for (const maybeAddress of matches) {
        if (isAddress(maybeAddress)) {
          // Normalize the address
          const normalizedAddr = asLowerCaseAddress(maybeAddress);
          // Add the normalized address to the set
          uniqueAddresses.add(normalizedAddr);
        } else {
          // Ignore invalid addresses
        }
      }
    }
  };

  // Helper function to search for serialized addresses (hex strings in calldata)
  const searchForSerializedAddresses = (text: string) => {
    // Match addresses in serialized input - look for patterns in
    // typical EVM input data. This regex finds 40-char hex sequences
    // that appear after typical position markers (24 zeroes) in calldata.
    const regex = /000000000000000000000000([a-fA-F0-9]{40})/gi;
    const m = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      // match[1] contains the extracted address part (without the 24 zeroes)
      const maybePartialAddress = match[1];

      if (!maybePartialAddress) {
        // If no address part is found, skip this match
        continue;
      }

      const maybeAddress = `0x${maybePartialAddress}`;

      if (isAddress(maybeAddress)) {
        // Add 0x prefix and normalize the address
        const normalizedAddr = asLowerCaseAddress(maybeAddress);
        // Add the normalized address to the set
        uniqueAddresses.add(normalizedAddr);
      } else {
        // Ignore invalid addresses
      }
    }
  };

  searchForPlainAddresses(text);
  searchForSerializedAddresses(text);

  return uniqueAddresses;
}
