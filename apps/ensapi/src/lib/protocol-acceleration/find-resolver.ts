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
  type DomainId,
  getDatasourceContract,
  getNameHierarchy,
  isENSv1Registry,
  type Name,
  type Node,
  type NormalizedName,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/instrumentation/auto-span";

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
 * Registry can be:
 * - ENSv1 Root Chain Registry
 * - ENSv1 Basenames (shadow) Registry
 * - ENSv1 Lineanames (shadow) Registry
 * - TODO: any ENSv2 Registry
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
  //   then we can identify a node's active resolver via the indexed Domain-Resolver Relationships.
  //////////////////////////////////////////////////
  if (accelerate && canAccelerate) {
    return findResolverWithIndex(registry, name);
  }

  // Invariant: UniversalResolver#findResolver only works for ENS Root Registry
  if (!isENSv1Registry(config.namespace, registry)) {
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
      // TODO: all of this logic needs to be updated for ENSv2 Datamodel, need to reference new UR

      // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
      const names = getNameHierarchy(name);

      // Invariant: there is at least 1 name in the hierarchy
      if (names.length === 0) {
        throw new Error(`Invariant(findResolverWithIndex): received an invalid name: '${name}'`);
      }

      // 2. compute domainId of each node
      // NOTE: this is currently ENSv1-specific
      const nodes = names.map((name) => namehash(name) as Node);
      const domainIds = nodes as DomainId[];

      // 3. for each domain, find its associated resolver in the selected registry
      const domainResolverRelations = await withSpanAsync(
        tracer,
        "domainResolverRelation.findMany",
        {},
        async () => {
          // the current ENS Root Chain Registry is actually ENSRegistryWithFallback: if a node
          // doesn't exist in its own storage, it directs the lookup to RegistryOld. We must encode
          // this logic here, so that the active resolver of unmigrated nodes can be correctly identified.
          // https://github.com/ensdomains/ens-contracts/blob/be53b9c25be5b2c7326f524bbd34a3939374ab1f/contracts/registry/ENSRegistryWithFallback.sol#L19
          const records = await db.query.domainResolverRelation.findMany({
            where: (t, { inArray, and, or, eq }) =>
              and(
                or(
                  ...[
                    // filter for Domain-Resolver Relationship in the current Registry
                    and(eq(t.chainId, registry.chainId), eq(t.address, registry.address)),
                    // OR, if the registry is the ENS Root Registry, also include records from RegistryOld
                    isENSv1Registry(config.namespace, registry) &&
                      and(eq(t.chainId, RegistryOld.chainId), eq(t.address, RegistryOld.address)),
                  ].filter((c) => !!c),
                ),
                // filter for Domain-Resolver Relations for the following DomainIds
                inArray(t.domainId, domainIds),
              ),
          });

          // 3.1 sort into the same order as `domainIds`: db results are not guaranteed to match `inArray` order
          // NOTE: we also sort with a preference for `registry` matching the specific Registry we're
          // searching within — this provides the "prefer Domain-Resolver-Relationships in Registry
          // over RegistryOld" necessary to implement fallback.
          records.sort((a, b) => {
            // if the DomainIds match, prefer exact-registry-match
            if (a.domainId === b.domainId) return accountIdEqual(a, registry) ? -1 : 1;

            // otherwise, sort by order in `domainIds`
            return domainIds.indexOf(a.domainId) > domainIds.indexOf(b.domainId) ? 1 : -1;
          });

          return records;
        },
      );

      // 4. If no Domain-Resolver Relations were found, there is no active resolver for the given domain
      if (domainResolverRelations.length === 0) return NULL_RESULT;

      // 5. The first record is the active resolver
      const { domainId, resolver } = domainResolverRelations[0];

      // Invariant: Domain-Resolver Relations encodes the unsetting of a Resolver as null, so `resolver`
      // should never be zeroAddress.
      if (isAddressEqual(resolver, zeroAddress)) {
        throw new Error(
          `Invariant(findResolverWithIndex): Encountered a zeroAddress resolverAddress for ${domainId}, which should be impossible: check ProtocolAcceleration Domain-Resolver Relation indexing logic.`,
        );
      }

      // map the relation's `domainId` back to its name in `names`
      const indexInHierarchy = domainIds.indexOf(domainId);
      const activeName = names[indexInHierarchy];

      // will never occur, exlusively for typechecking
      if (!activeName) {
        throw new Error(
          `Invariant(findResolverWithIndex): activeName could not be determined. names = ${JSON.stringify(names)} domains = ${JSON.stringify(domainIds)} active resolver's domainId: ${domainId}.`,
        );
      }

      return {
        activeName,
        activeResolver: resolver,
        // this resolver must have wildcard support if it was not for the first domain in our hierarchy
        requiresWildcardSupport: indexInHierarchy > 0,
      };
    },
  );
}
