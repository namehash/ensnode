import { type DomainId, makeResolverId } from "enssdk";

import { getRootRegistry } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { findResolverWithIndex } from "@/lib/protocol-acceleration/find-resolver";

/**
 * Identifies the Resolver that this Domain has _assigned_, if any.
 *
 * NOTE: this is the Domain's _assigned_ Resolver, _not_ its _effective_ Resolver. See
 * {@link getDomainEffectiveResolver}.
 */
export async function getDomainAssignedResolver(domainId: DomainId) {
  const { ensDb } = di.context;
  const drr = await ensDb.query.domainResolverRelation.findFirst({
    where: (t, { eq }) => eq(t.domainId, domainId),
    with: { resolver: true },
  });

  return drr?.resolver;
}

/**
 * Identifies the Resolver that ENS Forward Resolution (ENSIP-10) lands on for this Domain — i.e.
 * its _effective_ Resolver — by walking the Domain's name hierarchy via indexed data
 * ({@link findResolverWithIndex}), beginning from the Root Registry (the entry point for Forward
 * Resolution).
 *
 * Returns null when the Domain is not in the Canonical Nametree (no name to resolve against) or when
 * no active Resolver exists for it.
 */
export async function getDomainEffectiveResolver(domainId: DomainId) {
  const { ensDb, namespace } = di.context;

  const domain = await ensDb.query.domain.findFirst({
    where: (t, { eq }) => eq(t.id, domainId),
  });

  // a Domain outside the Canonical Nametree has no name to perform Forward Resolution against
  if (!domain?.canonicalName) return null;

  // Forward Resolution always begins at the Root Registry
  const registry = getRootRegistry(namespace);

  const { activeResolver } = await findResolverWithIndex(registry, domain.canonicalName);

  if (!activeResolver) return null;

  // the effective Resolver lives on the Root Registry's chain
  return makeResolverId({ chainId: registry.chainId, address: activeResolver });
}
