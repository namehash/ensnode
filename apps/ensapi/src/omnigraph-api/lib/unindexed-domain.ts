import {
  type DomainId,
  type InterpretedName,
  interpretedLabelsToInterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  isResolvableName,
  makeUnindexedDomainId,
  type Node,
  namehashInterpretedName,
  type RegistryId,
  type UnindexedDomainId,
} from "enssdk";

import type di from "@/di";
import {
  type WalkResultRow,
  walkResultRowHasResolver,
} from "@/lib/protocol-acceleration/forward-walk-disjoint-namegraph";
import { forwardWalkNamegraph } from "@/omnigraph-api/lib/get-domain-by-interpreted-name";

/**
 * A resolvable-but-unindexed Domain: the indexer has no row for it, but it is resolvable because the
 * deepest Resolver along its namegraph path is an ENSIP-10 wildcard (`extended`) Resolver — e.g.
 * off-chain / CCIP-Read names, unindexed 3DNS names, and wildcard subnames. Minted by
 * {@link makeUnindexedDomain}; never loaded from the index.
 *
 * It is a member of the Domain interface's Shape alongside the indexed Domain row, so it mirrors
 * exactly the indexed-Domain fields that the Domain interface's (and DomainCanonical's) field
 * resolvers read, and the `UnindexedDomain` GraphQL type has no concrete-type fields of its own. It
 * IS Canonical (it is named, via the queried Name), so its canonical metadata is populated;
 * `DomainCanonical.path` is built lazily by {@link computeUnindexedDomainCanonicalPath} (its
 * leaf/intermediate nodes are virtual and cannot be loaded by id).
 */
export interface UnindexedDomain {
  type: "UnindexedDomain";
  id: UnindexedDomainId;
  /** The Registry that manages the ancestor Domain bearing the wildcard Resolver. */
  registryId: RegistryId;

  // mirrors of the indexed-Domain fields read by the Domain interface / DomainCanonical resolvers
  label: typeof di.context.ensIndexerSchema.label.$inferSelect;
  ownerId: null;
  subregistryId: null;
  canonical: true;
  canonicalName: InterpretedName;
  canonicalDepth: number;
  canonicalNode: Node;
}

export const isUnindexedDomain = (domain: { type: string }): domain is UnindexedDomain =>
  domain.type === "UnindexedDomain";

/**
 * Constructs the {@link UnindexedDomain} for `name` from the namegraph walk `rows` for that name, or
 * returns null when `name` does not name one: it is indexed (an exact match), it has no ancestor
 * ENSIP-10 wildcard Resolver, or it is not a {@link isResolvableName | ResolvableName}.
 *
 * Takes the walk `rows` (rather than walking itself) so the caller's single
 * {@link forwardWalkNamegraph} can be reused — including across all suffixes of a name, which share
 * the same indexed-ancestor `rows` (see {@link computeUnindexedDomainCanonicalPath}).
 */
export function makeUnindexedDomain(
  name: InterpretedName,
  rows: WalkResultRow[],
): UnindexedDomain | null {
  // a name with an Encoded LabelHash or an over-long label cannot be DNS-encoded / resolved
  if (!isResolvableName(name)) return null;

  const labels = interpretedNameToInterpretedLabels(name);

  // an exact match (deepest row is the leaf) is an indexed Domain, not an UnindexedDomain
  if (rows[0]?.depth === labels.length) return null;

  // resolvable-but-unindexed iff the deepest (ancestor) Resolver is an ENSIP-10 wildcard Resolver
  // (mirrors UniversalResolver's _checkResolver: a static ancestor Resolver cannot resolve a
  // descendant, so the name is nonexistent)
  const effective = rows.find(walkResultRowHasResolver);
  if (!effective?.extended) return null;

  const node = namehashInterpretedName(name);
  const path = interpretedLabelsToLabelHashPath(labels);

  return {
    type: "UnindexedDomain",
    id: makeUnindexedDomainId(effective.registryId, node),
    registryId: effective.registryId,
    label: { labelHash: path[path.length - 1], interpreted: labels[0] },
    ownerId: null,
    subregistryId: null,
    canonical: true,
    canonicalName: name,
    canonicalDepth: labels.length,
    canonicalNode: node,
  } satisfies UnindexedDomain;
}

/**
 * Lazily builds the Canonical Path (root→leaf inclusive) of a resolvable-but-unindexed Domain: the
 * deepest indexed ancestor's materialized canonical path (loaded by id), followed by an
 * {@link UnindexedDomain} for each label below it down to the leaf (passed through as resolved
 * values, since virtual nodes cannot be loaded by id). Used by `DomainCanonical.path`.
 *
 * @dev all suffixes of `name` below the deepest indexed ancestor share the same indexed-ancestor
 * `rows`, so a single walk is reused to mint every virtual node.
 */
export async function computeUnindexedDomainCanonicalPath(
  domain: UnindexedDomain,
): Promise<(DomainId | UnindexedDomain)[]> {
  const name = domain.canonicalName;
  const { rows } = await forwardWalkNamegraph(name);

  // the deepest indexed ancestor (rows are ordered depth DESC) anchors the indexed canonical prefix
  const deepest = rows[0];
  const indexedPrefix = deepest?.canonicalPath ?? [];
  const deepestIndexedDepth = deepest?.depth ?? 0;

  // mint an UnindexedDomain for each label below the deepest indexed ancestor, in root→leaf order
  const labels = interpretedNameToInterpretedLabels(name); // leaf-first
  const leafDepth = labels.length;
  const virtualNodes = Array.from({ length: leafDepth - deepestIndexedDepth }, (_, i) => {
    const depth = deepestIndexedDepth + 1 + i;
    return makeUnindexedDomain(
      interpretedLabelsToInterpretedName(labels.slice(leafDepth - depth)),
      rows,
    );
  });

  return [...indexedPrefix, ...virtualNodes.filter((node) => node !== null)];
}
