import config from "@/config";

import { bytesToPacket } from "@ensdomains/ensjs/utils";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  type Address,
  isAddressEqual,
  namehash,
  type PublicClient,
  toHex,
  zeroAddress,
} from "viem";
import { packetToBytes } from "viem/ens";

import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import {
  type AccountId,
  accountIdEqual,
  getDatasourceContract,
  getNameHierarchy,
  type Name,
  type Node,
  type NormalizedName,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { isENSRootRegistry } from "@/lib/protocol-acceleration/ens-root-registry";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/tracing/auto-span";

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

const RegistryOld = getDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "RegistryOld");

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
  canAccelerate,
  publicClient,
}: {
  registry: AccountId;
  name: NormalizedName;
  accelerate: boolean;
  canAccelerate: boolean;
  publicClient: PublicClient;
}) {
  //////////////////////////////////////////////////
  // Protocol Acceleration: Active Resolver Identification
  //   If:
  //    1) the caller requested acceleration, and
  //    2) the ProtocolAcceleration plugin is active,
  //   then we can identify a node's active resolver via the indexed Node-Resolver Relationships.
  //////////////////////////////////////////////////
  if (accelerate && canAccelerate) {
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

      // 3. for each node, find its resolver in the selected registry
      const nodeResolverRelations = await withSpanAsync(
        tracer,
        "nodeResolverRelation.findMany",
        {},
        async () => {
          // the current ENS Root Chain Registry is actually ENSRegistryWithFallback: if a node
          // doesn't exist in its own storage, it directs the lookup to RegistryOld. We must encode
          // this logic here, so that the active resolver of unmigrated nodes can be correctly identified.
          // https://github.com/ensdomains/ens-contracts/blob/be53b9c25be5b2c7326f524bbd34a3939374ab1f/contracts/registry/ENSRegistryWithFallback.sol#L19
          const records = await db.query.nodeResolverRelation.findMany({
            where: (nrr, { inArray, and, or, eq }) =>
              and(
                or(
                  ...[
                    // filter for Node-Resolver Relationship in the current Registry
                    and(eq(nrr.chainId, registry.chainId), eq(nrr.registry, registry.address)),
                    // OR, if the registry is the ENS Root Registry, also include records from RegistryOld
                    isENSRootRegistry(registry) &&
                      and(
                        eq(nrr.chainId, RegistryOld.chainId),
                        eq(nrr.registry, RegistryOld.address),
                      ),
                  ].filter((c) => !!c),
                ),
                // filter for Node-Resolver Relations for the following Nodes
                inArray(nrr.node, nodes),
              ),
          });

          // 3.1 sort into the same order as `nodes`: db results are not guaranteed to match `inArray` order
          // NOTE: we also sort with a preference for `registry` matching the specific Registry we're
          // searching within — this provides the "prefer Node-Resolver-Relationships in Registry
          // over RegistryOld" necessary to implement fallback.
          records.sort((a, b) => {
            // if the nodes match, prefer exact-registry-match
            if (a.node === b.node) {
              return accountIdEqual({ chainId: a.chainId, address: a.registry }, registry) ? -1 : 1;
            }

            // otherwise, sort by order in `nodes`
            return nodes.indexOf(a.node) > nodes.indexOf(b.node) ? 1 : -1;
          });

          // cast into our semantic types
          return records as { node: Node; resolver: Address }[];
        },
      );

      // 4. If no Node-Resolver Relations were found, there is no active resolver for the given node
      if (nodeResolverRelations.length === 0) return NULL_RESULT;

      // 5. The first record is the active resolver
      const { node, resolver } = nodeResolverRelations[0];

      // Invariant: Node-Resolver Relations encodes the unsetting of a Resolver as null, so `resolver`
      // should never be zeroAddress.
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
    },
  );
}
