import { Context } from "ponder:registry";
import { Address } from "viem";

import { LabelHash, LiteralLabel, maybeHealLabelByReverseAddress } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { EventWithArgs } from "@/lib/ponder-helpers";
import {
  DebugTraceTransactionSchema,
  getAddressesFromTrace,
} from "@/lib/trace-transaction-helpers";
import { getENSRootChainId } from "@ensnode/datasources";

/**
 * Heals the first label of a Reverse Name given the transaction that emitted Registry#NewOwner.
 * @returns a healed LiteralLabel
 * @throws if unable to heal the Reverse Name's label
 */
export async function healReverseNameLabel(
  context: Context,
  event: EventWithArgs<{ owner: Address }>,
  labelHash: LabelHash,
): Promise<LiteralLabel> {
  if (context.chain.id !== getENSRootChainId(config.namespace)) {
    throw new Error(
      `Invariant(healReverseNameLabel): Only valid in the context of the ENS Root Chain, instead got ${context.chain.id}.`,
    );
  }

  // First, try healing with the transaction sender address.
  //
  // NOTE: In most cases, the transaction sender calls `setName` on the ENS Registry, which may
  // request the ENS Reverse Registry to create a reverse address record assigned to the transaction
  // sender address.
  //
  // Contract call:
  // https://etherscan.io/address/0x084b1c3c81545d370f3634392de611caabff8148#code#L106
  //
  // For these transactions, the transaction sender address is used to heal the reverse address label.
  //
  // Example transaction:
  // https://etherscan.io/tx/0x17697f8a43a9fc2d79ea8686366f2df3814a4dd6802272c06ce92cb4b9e5dc1b
  const healedFromSender = maybeHealLabelByReverseAddress(labelHash, event.transaction.from);
  if (healedFromSender !== null) return healedFromSender;

  // If healing with sender address didn't work, try healing with the event's `owner` address.
  //
  // NOTE: Sometimes the transaction sender calls a proxy contract to interact with
  // the ENS Registry. In these cases, the ENS Registry sees the proxy contract as
  // the sender (`msg.sender`) and uses this address to create a reverse address record.
  // For these transactions, the `owner` address is used to heal the reverse address label.
  //
  // Example transaction:
  // https://etherscan.io/tx/0xf0109fcbba1cea0d42e744c1b5b69cc4ab99d1f7b3171aee4413d0426329a6bb
  const healedFromOwner = maybeHealLabelByReverseAddress(labelHash, event.args.owner);
  if (healedFromOwner !== null) return healedFromOwner;

  // If previous healing methods failed, try addresses from transaction traces. In rare cases,
  // neither the transaction sender nor event owner is used for the reverse address record.
  // This can happen if the sender calls a factory contract that creates a new contract, which
  // then acquires a subdomain under a proxy-managed ENS name. The new contract's address is
  // used for the reverse record and is only found in traces, not as sender or owner.
  //
  // For these transactions, search the traces for addresses that could heal the label. All
  // caller addresses are included in traces. This brute-force method is a last resort, as it
  // requires an extra RPC call and parsing all addresses involved in the transaction.
  //
  // Example transaction:
  // https://etherscan.io/tx/0x9a6a5156f9f1fc6b1d5551483b97930df32e802f2f9229b35572170f1111134d

  // The `debug_traceTransaction` RPC call is cached by Ponder
  const traces = await context.client.request<DebugTraceTransactionSchema>({
    method: "debug_traceTransaction",
    params: [event.transaction.hash, { tracer: "callTracer" }],
  });

  // extract all addresses from the traces
  const allAddressesInTransaction = getAddressesFromTrace(traces);

  // iterate over all addresses in the transaction traces
  // and try to heal the label with each address
  for (const address of allAddressesInTransaction) {
    const healedFromTrace = maybeHealLabelByReverseAddress(labelHash, address);
    if (healedFromTrace !== null) return healedFromTrace;
  }

  // Invariant: by this point, we should have healed all Reverse Names
  throw new Error(
    `Invariant(healReverseName): Unable to heal the label for labelHash '${labelHash}'.`,
  );
}
