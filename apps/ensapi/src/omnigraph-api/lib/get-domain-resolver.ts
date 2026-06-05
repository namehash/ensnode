import { type DomainId, makeResolverId } from "enssdk";

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
 * its _effective_ Resolver — by walking the name hierarchy within the Domain's Registry via indexed
 * data ({@link findResolverWithIndex}).
 *
 * Returns null when the Domain is not in the canonical nametree (no name to resolve against) or when
 * no active Resolver exists for it.
 */
export async function getDomainEffectiveResolver(domainId: DomainId) {
  const { ensDb } = di.context;

  const domain = await ensDb.query.domain.findFirst({
    where: (t, { eq }) => eq(t.id, domainId),
    with: { registry: true },
  });

  // a Domain outside the canonical nametree has no name to perform Forward Resolution against
  if (!domain?.canonicalName) return null;

  const registry = { chainId: domain.registry.chainId, address: domain.registry.address };

  const { activeResolver } = await findResolverWithIndex(registry, domain.canonicalName);

  if (!activeResolver) return null;

  // the effective Resolver lives on the Registry's chain
  return makeResolverId({ chainId: registry.chainId, address: activeResolver });
}
