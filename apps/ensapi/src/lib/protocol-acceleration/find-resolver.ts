import { bytesToPacket } from "@ensdomains/ensjs/utils";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  type AccountId,
  type Address,
  asInterpretedName,
  type DomainId,
  getNameHierarchy,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  makeConcreteRegistryId,
  makeENSv1DomainId,
  namehashInterpretedName,
} from "enssdk";
import { isAddressEqual, type PublicClient, toHex, zeroAddress } from "viem";
import { packetToBytes } from "viem/ens";

import { DatasourceNames, getDatasource, maybeGetDatasource } from "@ensnode/datasources";
import { accountIdEqual, isENSv1Registry } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { withActiveSpanAsync, withSpanAsync } from "@/lib/instrumentation/auto-span";
import {
  forwardWalkDisjointNamegraph,
  walkResultRowHasResolver,
} from "@/lib/protocol-acceleration/forward-walk-disjoint-namegraph";

type FindResolverResult =
  | {
      activeName: null;
      activeResolver: null;
      requiresWildcardSupport: undefined;
    }
  | { activeName: InterpretedName; requiresWildcardSupport: boolean; activeResolver: Address };

const NULL_RESULT: FindResolverResult = {
  activeName: null,
  activeResolver: null,
  requiresWildcardSupport: undefined,
};

const tracer = trace.getTracer("find-resolver");

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
  name: InterpretedName;
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
  if (!isENSv1Registry(di.context.namespace, registry)) {
    throw new Error(
      `Invariant(findResolver): UniversalResolver#findResolver only identifies active resolvers against the ENS Root Registry, but a different Registry contract was passed: ${JSON.stringify(registry)}.`,
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
  name: InterpretedName,
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
      } = getDatasource(di.context.namespace, DatasourceNames.ENSRoot);

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
      // Invariant: the decoded name is a LiteralName that must conform to InterpretedName
      const activeName = asInterpretedName(bytesToPacket(dnsEncodedNameBytes.slice(offset)));

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
 * Forks by namespace data model:
 * - ENSv1-only namespaces depend solely on Protocol Acceleration data
 * - ENSv2 must walk the namegraph, so it has a dependency on the unigraph plugin
 *
 * @param registry — the AccountId of the Registry / Shadow Registry to begin from
 * @param name - The ENS name to find the active Resolver for
 */
export async function findResolverWithIndex(
  registry: AccountId,
  name: InterpretedName,
): Promise<FindResolverResult> {
  // TODO(fold-protocol-acceleration): once the Protocol Acceleration plugin is folded into the
  // Unigraph plugin, the `domain` table is guaranteed wherever Domain-Resolver Relations exist, so
  // this ENSv1/ENSv2 fork collapses — delete findResolverWithIndexENSv1 and always walk the namegraph
  // (findResolverWithIndexENSv2), which handles both data models.
  return maybeGetDatasource(di.context.namespace, DatasourceNames.ENSv2Root)
    ? findResolverWithIndexENSv2(registry, name)
    : findResolverWithIndexENSv1(registry, name);
}

/**
 * ENSv1 active-resolver identification: computes the namehash-keyed DomainId of each ancestor and
 * reads the Domain-Resolver Relations directly. Depends only on Protocol Acceleration data.
 *
 * TODO(fold-protocol-acceleration): remove this function once Protocol Acceleration is folded into
 * Unigraph — the namegraph walk (findResolverWithIndexENSv2) then handles ENSv1 too.
 */
async function findResolverWithIndexENSv1(
  registry: AccountId,
  name: InterpretedName,
): Promise<FindResolverResult> {
  return withActiveSpanAsync(
    tracer,
    "findResolverWithIndexENSv1",
    { chainId: registry.chainId, registry: registry.address, name },
    async () => {
      // 1. construct a hierarchy of names. i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
      const names = getNameHierarchy(name);

      // Invariant: there is at least 1 name in the hierarchy
      if (names.length === 0) {
        throw new Error(
          `Invariant(findResolverWithIndexENSv1): received an invalid name: '${name}'`,
        );
      }

      // 2. compute the namehash-keyed domainId of each node in the hierarchy
      const domainIds = names.map(
        (name) => makeENSv1DomainId(registry, namehashInterpretedName(name)) as DomainId,
      );

      // 3. for each domain, find its associated resolver in the selected registry
      const domainResolverRelations = await withSpanAsync(
        tracer,
        "domainResolverRelation.findMany",
        {},
        async () => {
          // NOTE: because DRRs are now canonicalized against the managedName's Registry, we no longer
          // need to also join ENSv1RegistryOld DRRs if the registry is the ENSv1Registry
          const { ensDb } = di.context;
          const records = await ensDb.query.domainResolverRelation.findMany({
            where: (t, { inArray, and, eq }) =>
              and(
                // filter for Domain-Resolver Relationship in the current Registry
                and(eq(t.chainId, registry.chainId), eq(t.address, registry.address)),
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
          `Invariant(findResolverWithIndexENSv1): Encountered a zeroAddress resolverAddress for ${domainId}, which should be impossible: check ProtocolAcceleration Domain-Resolver Relation indexing logic.`,
        );
      }

      // map the relation's `domainId` back to its name in `names`
      const indexInHierarchy = domainIds.indexOf(domainId);
      const activeName = names[indexInHierarchy];

      // will never occur, exclusively for typechecking
      if (!activeName) {
        throw new Error(
          `Invariant(findResolverWithIndexENSv1): activeName could not be determined. names = ${JSON.stringify(names)} domains = ${JSON.stringify(domainIds)} active resolver's domainId: ${domainId}.`,
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

/**
 * ENSv2 active-resolver identification: walks the namegraph by labelHash from `registry` and returns
 * the deepest ancestor Domain that has an assigned Resolver. Reads the `domain` table (the Registry
 * hierarchy), maintained by the Unigraph plugin.
 */
async function findResolverWithIndexENSv2(
  registry: AccountId,
  name: InterpretedName,
): Promise<FindResolverResult> {
  return withActiveSpanAsync(
    tracer,
    "findResolverWithIndexENSv2",
    { chainId: registry.chainId, registry: registry.address, name },
    async () => {
      const path = interpretedLabelsToLabelHashPath(interpretedNameToInterpretedLabels(name));

      // Invariant: there is at least 1 labelhash in the path
      if (path.length === 0) {
        throw new Error(
          `Invariant(findResolverWithIndexENSv2): received an invalid name: '${name}'`,
        );
      }

      // walk the namegraph from `registry`, joining each ancestor Domain to its Resolver
      const rows = await forwardWalkDisjointNamegraph(makeConcreteRegistryId(registry), path);

      // the deepest Domain with an assigned Resolver is the active Resolver (ENSIP-10)
      const active = rows.find(walkResultRowHasResolver);
      if (!active) return NULL_RESULT;

      // map `active.depth` back to its name: getNameHierarchy is ordered leaf-first, while `depth`
      // counts from the Root (depth 1 = TLD, depth = path.length = leaf)
      const activeName = getNameHierarchy(name)[path.length - active.depth];

      // will never occur, exclusively for typechecking
      if (!activeName) {
        throw new Error(
          `Invariant(findResolverWithIndexENSv2): activeName could not be determined for '${name}' at depth ${active.depth}.`,
        );
      }

      return {
        activeName,
        activeResolver: active.address,
        // this resolver requires wildcard support if it was set above the leaf Domain
        requiresWildcardSupport: active.depth < path.length,
      };
    },
  );
}
