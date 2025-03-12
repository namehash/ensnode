/**
 * constructs a Domain's name by traversing the hierarchical namespace upwards.
 * NOTE: likely more efficient than custom sql due to in-memory cache-ability
 */
async function constructDomainName(context: Context, domainId: string): Promise<string> {
  const domain = await context.db.find(schema.v2_domain, { id: domainId });
  if (!domain) {
    throw new Error(`constructDomainName: expected domainId "${domainId}" to exist, it does not`);
  }

  const parentRegistry = await context.db.find(schema.v2_registry, { id: domain.registryId });
  if (!parentRegistry) {
    throw new Error(
      `constructDomainName: expected registryId "${domain.registryId}" to exist, it does not`,
    );
  }

  // human-readable label or encoded labelHash
  const label = domain.label ?? encodeLabelhash(tokenIdToLabelHash(domain.tokenId));

  console.log("constructDomainName", { segment: label, parentId: parentRegistry.domainId });

  // this is the root Registry, which does not have an associated Domain
  if (!parentRegistry.domainId) return label;

  // otherwise, recurse
  return [label, await constructDomainName(context, parentRegistry.domainId)].join(".");
}

// updates a Domain's `name` and `node` by materializing its location in the hierarchical name tree
export async function materializeDomainName(context: Context, domainId: string) {
  const name = await constructDomainName(context, domainId);
  const node = namehash(name);

  await context.db.update(schema.v2_domain, { id: domainId }).set({ name, node });
}
