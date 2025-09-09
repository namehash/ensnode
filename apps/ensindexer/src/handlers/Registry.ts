import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, zeroAddress } from "viem";

import config from "@/config";
import {
  InterpretedLabel,
  InterpretedName,
  type LabelHash,
  LiteralLabel,
  type Node,
  REVERSE_ROOT_NODES,
  encodeLabelHash,
  literalLabelToInterpretedLabel,
  makeSubdomainNode,
  maybeHealLabelByReverseAddress,
} from "@ensnode/ensnode-sdk";

import {
  sharedEventValues,
  upsertAccount,
  upsertDomainResolverRelation,
  upsertResolver,
} from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeDomainResolverRelationId, makeResolverId } from "@/lib/ids";
import { isLabelSubgraphIndexable } from "@/lib/label-subgraph-indexable";
import { type EventWithArgs } from "@/lib/ponder-helpers";
import { recursivelyRemoveEmptyDomainFromParentSubdomainCount } from "@/lib/subgraph-helpers";
import {
  type DebugTraceTransactionSchema,
  getAddressesFromTrace,
} from "@/lib/trace-transaction-helpers";
import { getENSRootChainId } from "@ensnode/datasources";

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
    if (!domain.name) {
      const parent = await context.db.find(schema.domain, { id: parentNode });

      const ensRootChainId = getENSRootChainId(config.namespace);
      let healedLabel = null;

      // If healing labels from reverse addresses is enabled, the parent is a known reverse node
      // (i.e. addr.reverse), and the event comes from the chain that hosts the ENS Root, then attempt
      // to heal the unknown label.
      //
      // Note: Per ENSIP-19, only the ENS Root chain may record primary names under the `addr.reverse`
      // subname.
      //
      // Currently, we only heal primary names on the ENS Root chain. Support for healing primary
      // names on other chains will be added in the future.
      if (
        config.healReverseAddresses &&
        REVERSE_ROOT_NODES.has(parentNode) &&
        context.chain.id === ensRootChainId
      ) {
        // First, try healing with the transaction sender address.
        //
        // NOTE: In most cases, the transaction sender calls `setName` on the ENS Registry, which may
        // request the ENS Reverse Registry to create a reverse address record assigned to the transaction
        // sender address.
        //
        // Contract call:
        // https://etherscan.io/address/0x084b1c3c81545d370f3634392de611caabff8148#code#L106
        //
        // For these transactions, the transaction sender address is used to heal the reverse address
        // label.
        //
        // Example transaction:
        // https://etherscan.io/tx/0x17697f8a43a9fc2d79ea8686366f2df3814a4dd6802272c06ce92cb4b9e5dc1b
        healedLabel = maybeHealLabelByReverseAddress({
          maybeReverseAddress: event.transaction.from,
          labelHash,
        });

        // If healing with sender address didn't work, try healing with the event's `owner` address.
        //
        // NOTE: Sometimes the transaction sender calls a proxy contract to interact with
        // the ENS Registry. In these cases, the ENS Registry sees the proxy contract as
        // the sender (`msg.sender`) and uses this address to create a reverse address record.
        // For these transactions, the `owner` address is used to heal the reverse address label.
        //
        // Example transaction:
        // https://etherscan.io/tx/0xf0109fcbba1cea0d42e744c1b5b69cc4ab99d1f7b3171aee4413d0426329a6bb
        if (!healedLabel) {
          healedLabel = maybeHealLabelByReverseAddress({
            maybeReverseAddress: event.args.owner,
            labelHash,
          });
        }

        // If previous healing methods failed, try addresses from transaction traces. In rare cases,
        // neither the transaction sender nor event owner is used for the reverse address record.
        // This can happen if the sender calls a factory contract that creates a new contract, which
        // then acquires a subdomain under a proxy-managed ENS name. The new contract's address is
        // used for the reverse record and is only found in traces, not as sender or owner.
        //
        // For these transactions, search the traces for addresses that could heal the label. All
        // caller addresses are included in traces. This brute-force method is a last resort, as it
        // requires an extra RPC call and parsing all addresses involved in the transaction.
        //
        // Example transaction:
        // https://etherscan.io/tx/0x9a6a5156f9f1fc6b1d5551483b97930df32e802f2f9229b35572170f1111134d
        if (!healedLabel) {
          // The `debug_traceTransaction` RPC call is cached by Ponder.
          // It will only be made once per transaction hash and
          // the response will be stored in Ponder's RPC cache.
          const traces = await context.client.request<DebugTraceTransactionSchema>({
            method: "debug_traceTransaction",
            params: [event.transaction.hash, { tracer: "callTracer" }],
          });

          // extract all addresses from the traces
          const allAddressesInTransaction = getAddressesFromTrace(traces);

          // iterate over all addresses in the transaction traces
          // and try to heal the label with each address
          for (const maybeReverseAddress of allAddressesInTransaction) {
            healedLabel = maybeHealLabelByReverseAddress({
              maybeReverseAddress,
              labelHash,
            });

            if (healedLabel) {
              // break the loop after the first successful healing
              break;
            }
          }

          if (!healedLabel) {
            // by this point, we have exhausted all our strategies for healing
            // the reverse address and we still don't have a healed label,
            // so we throw an error to bring visibility to not achieving
            // the expected 100% success rate
            throw new Error(
              `A NewOwner event for a Reverse Node in the Root ENS Datasource on Chain ID "${ensRootChainId}" was emitted by the Registry in tx "${event.transaction.hash}", and we failed to heal reverse address for labelHash "${labelHash}".`,
            );
          }
        }
      }

      // 2. if reverse address healing didn't work, try ENSRainbow
      if (!healedLabel) {
        // attempt to heal the label associated with labelHash via ENSRainbow
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
        healedLabel = await labelByLabelHash(labelHash);
      }

      if (config.replaceUnnormalized) {
        // Interpret the `healedLabel` Literal Label into an Interpreted Label
        // see https://ensnode.io/docs/reference/terminology#literal-label
        // see https://ensnode.io/docs/reference/terminology#interpreted-label
        const interpretedLabel = (
          healedLabel !== null
            ? literalLabelToInterpretedLabel(healedLabel as LiteralLabel)
            : encodeLabelHash(labelHash)
        ) as InterpretedLabel;

        // to construct `Domain.name` use the parent's Name and the Interpreted Label
        // NOTE: for a TLD, the parent is null, so we just use the Label value as is
        const interpretedName = (
          parent?.name ? `${interpretedLabel}.${parent.name}` : interpretedLabel
        ) as InterpretedName;

        await context.db.update(schema.domain, { id: node }).set({
          name: interpretedName,
          labelName: interpretedLabel,
        });
      } else {
        // to construct `Domain.name` use the parent's name and the label value (encoded if not subgraph-indexable)
        // NOTE: for TLDs, the parent is null, so we just use the label value as is
        const subgraphInterpretedLabel = isLabelSubgraphIndexable(healedLabel)
          ? healedLabel
          : encodeLabelHash(labelHash);

        const subgraphInterpretedName = parent?.name
          ? `${subgraphInterpretedLabel}.${parent.name}`
          : subgraphInterpretedLabel;

        await context.db.update(schema.domain, { id: node }).set({
          name: subgraphInterpretedName,
          // NOTE(subgraph-compat): only update Domain.labelName iff label is healed and subgraph-indexable
          //   via: https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L113
          // NOTE(replace-unnormalized): it's specifically the Literal Label value that labelName
          //   is updated to, if it is subgraph-indexable, _not_ the Subgraph Interpreted Label
          labelName: isLabelSubgraphIndexable(healedLabel) ? healedLabel : undefined,
        });
      }
    }

    // garbage collect newly 'empty' domain iff necessary
    // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L85
    if (owner === zeroAddress) {
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
  if (owner === zeroAddress) {
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

  const isZeroResolver = resolverAddress === zeroAddress;
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
