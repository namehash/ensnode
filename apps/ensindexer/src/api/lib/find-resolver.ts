import { db } from "ponder:api";
import { DatasourceNames, getDatasource, getENSRootChainId } from "@ensnode/datasources";
import {
  ChainId,
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

import config from "@/config";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/auto-span";
import { parseResolverId } from "@/lib/ids";
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
const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Identifies the active resolver on `chainId` for `name`.
 *
 * NOTE: If calling `findResolver` for a chain other than the ENS Root Chain, it is the caller's
 * responsibility to ensure that the appropriate Domain-Resolver relations are indexed for the
 * specified chainId, or the `findResolverWithIndex` will return null.
 */
export async function findResolver({
  chainId,
  name,
  accelerate,
  publicClient,
}: { chainId: ChainId; name: NormalizedName; accelerate: boolean; publicClient: PublicClient }) {
  if (chainId === ensRootChainId) {
    // if we're on the ENS Root Chain, we have the option to accelerate resolver lookups iff the
    // ProtocolAcceleration plugin is active
    if (accelerate && config.plugins.includes(PluginName.ProtocolAcceleration)) {
      return findResolverWithIndex(chainId, name);
    }

    // query the UniversalResolver on the ENSRoot Chain (via RPC)
    return findResolverWithUniversalResolver(publicClient, name);
  }

  // Implicit Invariant: calling `findResolver` in the context of a non-root chain only makes sense
  // in the context of Protocol-Accelerated logic: besides the ENS Root Chain, `findResolver` should
  // _ONLY_ be called with chains for which we are guaranteed to have the Domain-Resolver relations
  // indexed. This is enforced by the requirement that `forwardResolve` with non-ENSRoot chain ids is
  // only called when a known offchain lookup resolver defers to a plugin that is active.

  // at this point we _must_ have access to the indexed Domain-Resolver relations necessary to look up
  // the Domain's configured Resolver (see invariant above), so retrieve the name's active resolver
  // from the index.
  return findResolverWithIndex(chainId, name);
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
 * @param chainId — the chain ID upon which to find a Resolver
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
  chainId: ChainId,
  name: NormalizedName,
): Promise<FindResolverResult> {
  if (!config.plugins.includes(PluginName.ProtocolAcceleration)) {
    throw new Error(
      "Invariant(findResolverWithIndex): ProtocolAcceleration plugin must be enabled in order to accelerate the identification of a name's active resolver.",
    );
  }

  return withActiveSpanAsync(tracer, "findResolverWithIndex", { chainId, name }, async () => {
    // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
    const names = getNameHierarchy(name);

    // Invariant: there is at least 1 name in the hierarchy
    if (names.length === 0) {
      throw new Error(`Invariant(findResolverWithIndex): received an invalid name: '${name}'`);
    }

    // 2. compute node of each via namehash
    const nodes = names.map((name) => namehash(name) as Node);

    // 3. for each domain, find its associated resolver (only on the specified chain)
    const domainResolverRelations = await withSpanAsync(
      tracer,
      "ext_domainResolverRelation.findMany",
      {},
      () =>
        db.query.ext_domainResolverRelation.findMany({
          where: (drr, { inArray, and, eq }) =>
            and(
              inArray(drr.domainId, nodes), // find Relations for the following Domains
              eq(drr.chainId, chainId), // exclusively on the requested chainId
            ),
          columns: { chainId: true, domainId: true, resolverId: true }, // retrieve resolverId
        }),
    );

    // 3.1 sort into the same order as `nodes`, db results are not guaranteed to match `inArray` order
    domainResolverRelations.sort((a, b) =>
      nodes.indexOf(a.domainId as Node) > nodes.indexOf(b.domainId as Node) ? 1 : -1,
    );

    // 4. iterate up the hierarchy and return the first valid resolver
    for (const drr of domainResolverRelations) {
      // find the first one with a resolver
      if (drr.resolverId !== null) {
        // parse out its address
        const { address: resolverAddress } = parseResolverId(drr.resolverId);

        // NOTE: this zeroAddress check is not strictly necessary, as ENSIndexer encodes a zeroAddress
        // resolver as the _absence_ of a Domain-Resolver relation, so there is no case where a
        // Domain-Resolver relation exists and the resolverAddress is zeroAddress, but we include this
        // check here to encode that explicitly.
        if (isAddressEqual(resolverAddress, zeroAddress)) continue;

        // map the drr's domainId (node) back to its name in `names`
        const indexInHierarchy = nodes.indexOf(drr.domainId as Node);
        const activeName = names[indexInHierarchy];

        // will never occur, exlusively for typechecking
        if (!activeName) {
          throw new Error(
            `Invariant(findResolverWithIndex): activeName could not be determined names = ${JSON.stringify(names)} nodes = ${JSON.stringify(nodes)} active resolver's domainId: ${drr.domainId}.`,
          );
        }

        return {
          activeName,
          activeResolver: resolverAddress,
          // this resolver must have wildcard support if it was not for the first node in our hierarchy
          requiresWildcardSupport: indexInHierarchy > 0,
        };
      }
    }

    // 5. unable to find an active resolver
    return NULL_RESULT;
  });
}
