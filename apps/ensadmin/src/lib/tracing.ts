import { renderMicroseconds } from "@/lib/time";
import type { ProtocolTrace } from "@ensnode/ensnode-sdk";

import { ForwardResolutionProtocolStep, ReverseResolutionProtocolStep } from "@ensnode/ensnode-sdk";

const FORWARD_STEPS: Record<ForwardResolutionProtocolStep, { title: string; description: string }> =
  {
    [ForwardResolutionProtocolStep.Operation]: {
      title: "Forward Resolution",
      description: "Forward Resolution is the process of resolving an ENS name's records.",
    },
    [ForwardResolutionProtocolStep.FindResolver]: {
      title: "Find Resolver",
      description: "The resolver responsible for a name's records must be determined.",
    },
    [ForwardResolutionProtocolStep.ActiveResolverExists]: {
      title: "Active Resolver Exists",
      description: "", // NOTE: events not yet rendered, not necessary
    },
    [ForwardResolutionProtocolStep.AccelerateENSIP19ReverseResolver]: {
      title: "Accelerate ENSIP-19 Reverse Resolver",
      description:
        "If the Resolver in question is an ENSIP-19 Reverse Resolver, and ENSIndexer is indexing the ReverseRegistries that provide the data to this Reverse Resolver, ENSIndexer can accelerate the request by querying the index directly.",
    },
    [ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver]: {
      title: "Accelerate Known OffchainLookup Resolver",
      description:
        "If the Resolver in question is an OffchainLookup Resolver, and ENSIndexer is indexing the plugin (i.e. Basenames, Lineanames) that it sources data from, ENSIndexer can accelerate the request by querying the index directly.",
    },
    [ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver]: {
      title: "Accelerate Known Onchain Static Resolver",
      description:
        "If the Resolver in question is an Onchain Static Resolver, and ENSIndexer is indexing its records, ENSIndexer can accelerate the request by querying the index directly.",
    },
    [ForwardResolutionProtocolStep.RequireResolver]: {
      title: "Require Resolver",
      description: "", // NOTE: events not yet rendered, not necessary
    },
    [ForwardResolutionProtocolStep.ExecuteResolveCalls]: {
      title: "Execute Resolve Calls",
      description:
        "Execute the record resolution calls via RPC, resolving the records from the chain directly.",
    },
  };

const REVERSE_STEPS: Record<ReverseResolutionProtocolStep, { title: string; description: string }> =
  {
    [ReverseResolutionProtocolStep.Operation]: {
      title: "Reverse Resolution",
      description:
        "Reverse Resolution is the process of resolving an EVM address' Primary Name on a specific chain.",
    },
    [ReverseResolutionProtocolStep.ResolveReverseName]: {
      title: "Resolve Reverse Name",
      description: "The Reverse Name's 'name' record is resolved.",
    },
    [ReverseResolutionProtocolStep.NameRecordExists]: {
      title: "Name Record Exists Check",
      description: "", // NOTE: events not yet rendered, not necessary
    },
    [ReverseResolutionProtocolStep.ForwardResolveAddressRecord]: {
      title: "Forward Resolve Address Record",
      description:
        "The resolved name's 'address' record (for the specified chainId's coinType) is resolved.",
    },
    [ReverseResolutionProtocolStep.VerifyResolvedAddressMatchesAddress]: {
      title: "Verify Resolved Address Matches Address",
      description: "", // NOTE: events not yet rendered, not necessary
    },
  };

export function renderProtocolStep(
  step: ForwardResolutionProtocolStep | ReverseResolutionProtocolStep,
) {
  return (
    FORWARD_STEPS[step as ForwardResolutionProtocolStep] ||
    REVERSE_STEPS[step as ReverseResolutionProtocolStep]
  );
}

export function renderTraceDuration(trace: ProtocolTrace) {
  if (trace.length === 0) throw new Error("Invariant: provided trace has no root span.");
  return renderMicroseconds(trace[0].duration);
}
