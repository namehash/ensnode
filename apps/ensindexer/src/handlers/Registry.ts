import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import config from "@/config";
import { getENSRootChainId } from "@ensnode/datasources";
import {
  ADDR_REVERSE_NODE,
  InterpretedLabel,
  InterpretedName,
  type LabelHash,
  LiteralLabel,
  type Node,
  SubgraphInterpretedLabel,
  SubgraphInterpretedName,
  encodeLabelHash,
  literalLabelToInterpretedLabel,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";

import {
  sharedEventValues,
  upsertAccount,
  upsertDomainResolverRelation,
  upsertResolver,
} from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { healAddrReverseSubnameLabel } from "@/lib/heal-addr-reverse-subname-label";
import { makeDomainResolverRelationId, makeResolverId } from "@/lib/ids";
import { isLabelSubgraphIndexable } from "@/lib/is-label-subgraph-indexable";
import { type EventWithArgs } from "@/lib/ponder-helpers";
import { recursivelyRemoveEmptyDomainFromParentSubdomainCount } from "@/lib/subgraph-helpers";

/**
 * shared handlers for a Registry contract
 */

export const handleNewOwner =
  (isMigrated: boolean) =>
  async ({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      // NOTE: `node` event arg represents a `Node` that is the _parent_ of the node the NewOwner event is about
      node: Node;
      // NOTE: `label` event arg represents a `LabelHash` for the sub-node under `node`
      label: LabelHash;
      owner: Address;
    }>;
  }) => {
    const { label: labelHash, node: parentNode, owner } = event.args;

    await upsertAccount(context, owner);

    // the domain in question is a subdomain of `parentNode`
    const node = makeSubdomainNode(labelHash, parentNode);

    let domain = await context.db.find(schema.domain, { id: node });

    // note that we set isMigrated in each branch such that if this domain is being
    // interacted with on the new registry, its migration status is set here
    if (domain) {
      // if the domain already exists, this is just an update of the owner record (& isMigrated)
      domain = await context.db
        .update(schema.domain, { id: node })
        .set({ ownerId: owner, isMigrated });
    } else {
      // otherwise create the domain (w/ isMigrated)
      domain = await context.db.insert(schema.domain).values({
        id: node,
        ownerId: owner,
        parentId: parentNode,
        createdAt: event.block.timestamp,
        labelhash: labelHash,
        isMigrated,
      });

      // and increment parent subdomainCount
      await context.db
        .update(schema.domain, { id: parentNode })
        .set((row) => ({ subdomainCount: row.subdomainCount + 1 }));
    }

    // if the domain doesn't yet have a name, attempt to construct it here
    if (domain.name === null) {
      const parent = await context.db.find(schema.domain, { id: parentNode });

      let healedLabel: LiteralLabel | null = null;

      // If:
      //  1. healing labels from reverse addresses is enabled (!isSubgraphCompatible), and
      //  2. the new domain is a child of addr.reverse, and
      //  3. the event is emitted on the ENS Root chain,
      // then: attempt to heal the unknown label via transaction context.
      //
      // Note: Per ENSIP-19, only the ENS Root chain may record primary names under the `addr.reverse`
      // subname. Also per ENSIP-19 no Reverse Names need exist in (shadow)Registries on non-root
      // chains, so we explicitly only support Root chain addr.reverse-based Reverse Names: ENSIP-19
      // CoinType-specific Reverse Names (ex: [address].[coinType].reverse) don't actually exist in
      // the ENS Registry: wildcard resolution is used, so this NewOwner event will never be emitted
      // with a domain created as a child of a Coin-Type specific Reverse Node (ex: [coinType].reverse).
      if (
        !config.isSubgraphCompatible &&
        parentNode === ADDR_REVERSE_NODE &&
        context.chain.id === getENSRootChainId(config.namespace)
      ) {
        healedLabel = await healAddrReverseSubnameLabel(context, event, labelHash);
      }

      // if reverse address healing didn't work, try ENSRainbow
      if (healedLabel === null) {
        // attempt to heal the label associated with labelHash via ENSRainbow
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
        healedLabel = await labelByLabelHash(labelHash);
      }

      if (config.isSubgraphCompatible) {
        // to construct `Domain.name` use the parent's name and the label value (encoded if not subgraph-indexable)
        // NOTE: for TLDs, the parent is null, so we just use the label value as is
        const subgraphInterpretedLabel = (
          isLabelSubgraphIndexable(healedLabel) ? healedLabel : encodeLabelHash(labelHash)
        ) as SubgraphInterpretedLabel;

        // a name constructed of Subgraph Interpreted Labels is Subgraph Interpreted
        const subgraphInterpretedName = (
          parent?.name ? `${subgraphInterpretedLabel}.${parent.name}` : subgraphInterpretedLabel
        ) as SubgraphInterpretedName;

        await context.db.update(schema.domain, { id: node }).set({
          name: subgraphInterpretedName,
          // NOTE(subgraph-compat): update Domain.labelName iff label is subgraph-indexable
          //   via: https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L113
          // NOTE(replace-unnormalized): it's specifically the Literal Label value that labelName
          //   is updated to, if it is subgraph-indexable, _not_ the Subgraph Interpreted Label
          labelName: isLabelSubgraphIndexable(healedLabel) ? healedLabel : undefined,
        });
      } else {
        // Interpret the `healedLabel` Literal Label into an Interpreted Label
        // see https://ensnode.io/docs/reference/terminology#literal-label
        // see https://ensnode.io/docs/reference/terminology#interpreted-label
        const interpretedLabel = (
          healedLabel !== null
            ? literalLabelToInterpretedLabel(healedLabel)
            : encodeLabelHash(labelHash)
        ) as InterpretedLabel;

        // to construct `Domain.name` use the parent's Name and the Interpreted Label
        // NOTE: for a TLD, the parent is null, so we just use the Label value as is
        // a name constructed of Interpreted Labels is Interpreted
        const interpretedName = (
          parent?.name ? `${interpretedLabel}.${parent.name}` : interpretedLabel
        ) as InterpretedName;

        await context.db.update(schema.domain, { id: node }).set({
          name: interpretedName,
          labelName: interpretedLabel,
        });
      }
    }

    // garbage collect newly 'empty' domain iff necessary
    // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L85
    if (isAddressEqual(owner, zeroAddress)) {
      await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
    }

    // log DomainEvent
    await context.db.insert(schema.newOwner).values({
      ...sharedEventValues(context.chain.id, event),
      parentDomainId: parentNode,
      domainId: node,
      ownerId: owner,
    });
  };

export async function handleTransfer({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; owner: Address }>;
}) {
  const { node, owner } = event.args;

  await upsertAccount(context, owner);

  // ensure domain & update owner
  await context.db
    .insert(schema.domain)
    .values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
    .onConflictDoUpdate({ ownerId: owner });

  // garbage collect newly 'empty' domain iff necessary
  if (isAddressEqual(owner, zeroAddress)) {
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  }

  // log DomainEvent
  await context.db.insert(schema.transfer).values({
    ...sharedEventValues(context.chain.id, event),
    domainId: node,
    ownerId: owner,
  });
}

export async function handleNewTTL({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; ttl: bigint }>;
}) {
  const { node, ttl } = event.args;

  // NOTE: the subgraph handles the case where the domain no longer exists, but domains are
  // never deleted, so we avoid implementing that check here
  // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L215

  await context.db.update(schema.domain, { id: node }).set({ ttl });

  // log DomainEvent
  await context.db.insert(schema.newTTL).values({
    ...sharedEventValues(context.chain.id, event),
    domainId: node,
    ttl,
  });
}

export async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; resolver: Address }>;
}) {
  const { node, resolver: resolverAddress } = event.args;

  const resolverId = makeResolverId(context.chain.id, resolverAddress, node);

  const isZeroResolver = isAddressEqual(resolverAddress, zeroAddress);
  const ensRootChainId = getENSRootChainId(config.namespace);
  // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
  // NOTE: Resolver records are not deleted
  if (isZeroResolver) {
    // NOTE(resolver-relations): unlink subgraph-schema Domain-Resolver relationship iff this is the ENSRoot's chain
    if (context.chain.id === ensRootChainId) {
      await context.db
        .update(schema.domain, { id: node })
        .set({ resolverId: null, resolvedAddressId: null });
    }

    // NOTE(resolver-relations): unlink multi-chain-compatible Domain and Resolver on this chain
    await context.db.delete(schema.ext_domainResolverRelation, {
      id: makeDomainResolverRelationId(context.chain.id, node),
    });

    // garbage collect newly 'empty' domain iff necessary
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  } else {
    // otherwise upsert the resolver
    const resolver = await upsertResolver(context, {
      id: resolverId,
      domainId: node,
      address: resolverAddress,
    });

    // NOTE(resolver-relations): link subgraph-schema Domain-Resolver relationship iff this is the ENSRoot's chain
    if (context.chain.id === ensRootChainId) {
      // update the domain to point to it, and materialize the eth addr
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L193
      await context.db.update(schema.domain, { id: node }).set({
        resolverId,
        resolvedAddressId: resolver.addrId,
      });
    }

    // NOTE(resolver-relations): link multi-chain-compatible Domain and Resolver on this chain
    await upsertDomainResolverRelation(context, {
      id: makeDomainResolverRelationId(context.chain.id, node),
      chainId: context.chain.id,
      domainId: node,

      resolverId,
    });
  }

  // log DomainEvent
  await context.db.insert(schema.newResolver).values({
    ...sharedEventValues(context.chain.id, event),
    domainId: node,
    // NOTE: this actually produces a bug in the subgraph's graphql layer — `resolver` is not nullable
    // but there is never a resolver record created for the zeroAddress. so if you query the
    // `resolver { id }` of a NewResolver event that set the resolver to zeroAddress
    // ex: newResolver(id: "3745840-2") { id resolver {id} }
    // you will receive a GraphQL type error. for subgraph compatibility we re-implement this
    // behavior here, but it should be entirely avoided in a v2 restructuring of the schema.
    resolverId: isZeroResolver ? zeroAddress : resolverId,
  });
}
