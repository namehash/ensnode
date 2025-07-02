import config from "@/config";
import { ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { Address } from "viem";

// NOTE: typing as ENSNamespace so we can access possibly undefined Datasources
const ensNamespace = getENSNamespace(config.namespace) as ENSNamespace;

/**
 * A mapping of Resolver Addresses on a given chain to the chain they defer resolution to.
 *
 * These resolvers must abide the following pattern:
 * 1. They _always_ emit OffchainLookup for any resolve() call to a well-known CCIP-Read Gateway
 * 2. That CCIP-Read Gateway exclusively sources the data necessary to process CCIP-Read Requests from
 *   the indicated L2.
 *
 * We build this object at runtime based on conditionally available Datasources.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
export const KNOWN_OFFCHAIN_LOOKUP_RESOLVERS: Record<number, Record<Address, number>> = {
  // on the ENS Deployment Chain
  [ensNamespace.ensroot.chain.id]: {
    // the Basenames L1Resolver defers to Base chain
    ...(!!ensNamespace.ensroot.contracts.BasenamesL1Resolver &&
      !!ensNamespace.basenames && {
        [ensNamespace.ensroot.contracts.BasenamesL1Resolver.address as Address]:
          ensNamespace.basenames.chain.id,
      }),

    // the LineaNames L1Resolver defers to Linea chain
    ...(!!ensNamespace.ensroot.contracts.LineaNamesL1Resolver &&
      !!ensNamespace.lineanames && {
        [ensNamespace.ensroot.contracts.LineaNamesL1Resolver.address as Address]:
          ensNamespace.lineanames.chain.id,
      }),
  },
};
