import { db } from "ponder:api";
import { DatasourceNames, getDatasource, getENSRootChainId } from "@ensnode/datasources";
import {
  AccountId,
  type Name,
  type Node,
  NormalizedName,
  PluginName,
  getNameHierarchy,
} from "@ensnode/ensnode-sdk";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  type Address,
  type PublicClient,
  isAddressEqual,
  namehash,
  toHex,
  zeroAddress,
} from "viem";
import { packetToBytes } from "viem/ens";

import { isENSRootRegistry } from "@/api/lib/protocol-acceleration/ens-root-registry";
import config from "@/config";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/auto-span";
import { bytesToPacket } from "@ensdomains/ensjs/utils";

type FindResolverResult =
  | {
      activeName: null;
      activeResolver: null;
      requiresWildcardSupport: undefined;
    }
  | { activeName: Name; requiresWildcardSupport: boolean; activeResolver: Address };

const NULL_RESULT: FindResolverResult = {
  activeName: null,
  activeResolver: null,
  requiresWildcardSupport: undefined,
};

const tracer = trace.getTracer("find-resolver");

/**
 * Identifies `name`'s active resolver in `registry`.
 *
 * Note that any `registry` that is not the ENS Root Chain's Registry is a Shadow Registry like
 * Basenames' or Lineanames' (shadow)Registry contracts.
 */
export async function findResolver({
  registry,
  name,
  accelerate,
  publicClient,
}: { registry: AccountId; name: NormalizedName; accelerate: boolean; publicClient: PublicClient }) {
  //////////////////////////////////////////////////
  // Protocol Acceleration: Active Resolver Identification
  //   If:
  //    1) the caller requested acceleration, and
  //    2) the ProtocolAcceleration plugin is active,
  //   then we can identify a node's active resolver via the indexed Node-Resolver Relationships.
  //////////////////////////////////////////////////
  if (accelerate && config.plugins.includes(PluginName.ProtocolAcceleration)) {
    return findResolverWithIndex(registry, name);
  }

  // Invariant: UniversalResolver#findResolver only works for ENS Root Registry
  if (!isENSRootRegistry(registry)) {
    throw new Error(
      `Invariant(findResolver): UniversalResolver#findResolver only identifies active resolvers agains the ENs Root Registry, but a different Registry contract was passed: ${JSON.stringify(registry)}.`,
    );
  }

  // query the UniversalResolver on the ENSRoot Chain (via RPC)
  return findResolverWithUniversalResolver(publicClient, name);
}

/**
 * Queries the resolverAddress for the specified `name` using the UniversalResolver via RPC.
 */
async function findResolverWithUniversalResolver(
  publicClient: PublicClient,
  name: Name,
): Promise<FindResolverResult> {
  return withActiveSpanAsync(
    tracer,
    "findResolverWithUniversalResolver",
    { name },
    async (span) => {
      // 1. Retrieve the UniversalResolver's address/abi in the configured namespace
      const {
        contracts: {
          UniversalResolver: { address, abi },
        },
      } = getDatasource(config.namespace, DatasourceNames.ENSRoot);

      // 2. Call UniversalResolver#findResolver via RPC
      const dnsEncodedNameBytes = packetToBytes(name);
      const [activeResolver, , _offset] = await withSpanAsync(
        tracer,
        "UniversalResolver#findResolver",
        { name },
        () =>
          publicClient.readContract({
            address,
            abi,
            functionName: "findResolver",
            args: [toHex(dnsEncodedNameBytes)],
          }),
      );

      // 3. Interpret results

      if (isAddressEqual(activeResolver, zeroAddress)) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: "activeResolver is zeroAddress" });
        return NULL_RESULT;
      }

      // will never occur, exclusively for the type checking...
      if (_offset > Number.MAX_SAFE_INTEGER) {
        throw new Error(
          `Invariant: UniversalResolver returned an offset (${_offset}) larger than MAX_SAFE_INTEGER.`,
        );
      }

      // offset is byte offset into DNS Encoded Name used for resolution
      const offset = Number(_offset);

      if (offset > dnsEncodedNameBytes.length) {
        throw new Error(
          `Invariant: findResolverWithUniversalResolver returned an offset (${offset}) larger than the number of bytes in the dns-encoding of '${name}' (${dnsEncodedNameBytes.length}).`,
        );
      }

      // UniversalResolver returns the offset in bytes within the DNS Encoded Name where the activeName begins
      const activeName: Name = bytesToPacket(dnsEncodedNameBytes.slice(offset));

      return {
        activeName,
        activeResolver,
        // this resolver must have wildcard support if it was not the 0th offset
        requiresWildcardSupport: offset > 0,
      };
    },
  );
}

/**
 * Identifies the active resolver for a given ENS name, using indexed data, following ENSIP-10.
 * This function parallels UniversalResolver#findResolver.
 *
 * @param registry — the AccountId of the Registry / Shadow Registry to use
 * @param name - The ENS name to find the Resolver for
 * @returns The resolver ID if found, null otherwise
 *
 * @example
 * ```ts
 * const resolverId = await identifyActiveResolver("sub.example.eth")
 * // Returns: "0x123..." or null if no resolver found
 * ```
 */
async function findResolverWithIndex(
  registry: AccountId,
  name: NormalizedName,
): Promise<FindResolverResult> {
  if (!config.plugins.includes(PluginName.ProtocolAcceleration)) {
    throw new Error(
      `Invariant(findResolverWithIndex): ProtocolAcceleration plugin must be enabled in order to accelerate the identification of a name's active resolver on chain ${registry.chainId}.`,
    );
  }

  return withActiveSpanAsync(
    tracer,
    "findResolverWithIndex",
    { chainId: registry.chainId, registry: registry.address, name },
    async () => {
      // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
      const names = getNameHierarchy(name);

      // Invariant: there is at least 1 name in the hierarchy
      if (names.length === 0) {
        throw new Error(`Invariant(findResolverWithIndex): received an invalid name: '${name}'`);
      }

      // 2. compute node of each via namehash
      const nodes = names.map((name) => namehash(name) as Node);

      // 3. for each node, find its associated resolver (only in the specified registry)
      const nodeResolverRelations = await withSpanAsync(
        tracer,
        "nodeResolverRelation.findMany",
        {},
        async () => {
          const records = await db.query.nodeResolverRelation.findMany({
            where: (nrr, { inArray, and, eq }) =>
              and(
                eq(nrr.chainId, registry.chainId), // exclusively for the requested registry
                eq(nrr.registry, registry.address), // exclusively for the requested registry
                inArray(nrr.node, nodes), // find Relations for the following Nodes
              ),
            columns: { node: true, resolver: true },
          });

          // cast into our semantic types
          return records as { node: Node; resolver: Address }[];
        },
      );

      // 3.1 sort into the same order as `nodes`, db results are not guaranteed to match `inArray` order
      nodeResolverRelations.sort((a, b) =>
        nodes.indexOf(a.node) > nodes.indexOf(b.node) ? 1 : -1,
      );

      // 4. iterate up the hierarchy and return the first valid resolver
      for (const { node, resolver } of nodeResolverRelations) {
        // NOTE: this zeroAddress check is not strictly necessary, as the ProtocolAcceleration plugin
        // encodes a zeroAddress resolver as the _absence_ of a Node-Resolver relation, so there is
        // no case where a Node-Resolver relation exists and the resolverAddress is zeroAddress, but
        // we include this invariant here to encode that expectation explicitly.
        if (isAddressEqual(resolver, zeroAddress)) {
          throw new Error(
            `Invariant(findResolverWithIndex): Encountered a zeroAddress resolverAddress for node ${node}, which should be impossible: check ProtocolAcceleration Node-Resolver Relation indexing logic.`,
          );
        }

        // map the relation's `node` back to its name in `names`
        const indexInHierarchy = nodes.indexOf(node);
        const activeName = names[indexInHierarchy];

        // will never occur, exlusively for typechecking
        if (!activeName) {
          throw new Error(
            `Invariant(findResolverWithIndex): activeName could not be determined. names = ${JSON.stringify(names)} nodes = ${JSON.stringify(nodes)} active resolver's node: ${node}.`,
          );
        }

        return {
          activeName,
          activeResolver: resolver,
          // this resolver must have wildcard support if it was not for the first node in our hierarchy
          requiresWildcardSupport: indexInHierarchy > 0,
        };
      }

      // 5. unable to find an active resolver
      return NULL_RESULT;
    },
  );
}
