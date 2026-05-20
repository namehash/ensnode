import config from "@/config";

import {
  ADDR_REVERSE_NODE,
  ENS_ROOT_NODE,
  type LabelHash,
  makeENSv1DomainId,
  makeENSv1RegistryId,
  makeENSv1VirtualRegistryId,
  makeSubdomainNode,
  type Node,
  type NormalizedAddress,
  type RegistryId,
} from "enssdk";
import { isAddressEqual, zeroAddress } from "viem";

import {
  ENSNamespaceIds,
  getENSRootChainId,
  interpretAddress,
  PluginName,
} from "@ensnode/ensnode-sdk";
import { isBridgedTargetRegistry, isBridgeOriginDomain } from "@ensnode/ensnode-sdk/internal";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import {
  ensureDomainInRegistry,
  handleBridgedResolverChange,
  handleRegistryCanonicalDomainUpdated,
  handleSubregistryUpdated,
} from "@/lib/ensv2/canonicality-db-helpers";
import { ensureDomainEvent, ensureEvent } from "@/lib/ensv2/event-db-helpers";
import { ensureLabel, ensureUnknownLabel, labelExists } from "@/lib/ensv2/label-db-helpers";
import { ensureRegistry } from "@/lib/ensv2/registry-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { healAddrReverseSubnameLabel } from "@/lib/heal-addr-reverse-subname-label";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import {
  nodeIsMigrated,
  nodeIsMigratedByParentAndLabel,
} from "@/lib/protocol-acceleration/migrated-node-db-helpers";

const pluginName = PluginName.Unigraph;

/**
 * Handler functions for ENSv1 Registry contracts.
 * - piggybacks Protocol Resolution plugin's Node Migration status
 */
export default function () {
  /**
   * Registry#NewOwner is either a new Domain OR the owner of the parent changing the owner of the child.
   */
  async function handleNewOwner({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{
      // NOTE: `node` event arg represents a `Node` that is the _parent_ of the node the NewOwner event is about
      node: Node;
      // NOTE: `label` event arg represents a `LabelHash` for the sub-node under `node`
      label: LabelHash;
      owner: NormalizedAddress;
    }>;
  }) {
    const { label: labelHash, node: parentNode, owner } = event.args;

    // if someone mints a node to the zero address, nothing happens in the Registry, so no-op
    if (isAddressEqual(zeroAddress, owner)) return;

    // Label Healing
    //
    // only attempt to heal label if it doesn't already exist
    const exists = await labelExists(context, labelHash);
    if (!exists) {
      // If this is a direct subname of addr.reverse, we have 100% on-chain label discovery.
      //
      // Note: Per ENSIP-19, only the ENS Root chain may record primary names under the `addr.reverse`
      // subname. Also per ENSIP-19 no Reverse Names need exist in (shadow)Registries on non-root
      // chains, so we explicitly only support Root chain addr.reverse-based Reverse Names: ENSIP-19
      // CoinType-specific Reverse Names (ex: [address].[coinType].reverse) don't actually exist in
      // the ENS Registry: wildcard resolution is used, so this NewOwner event will never be emitted
      // with a domain created as a child of a Coin-Type specific Reverse Node (ex: [coinType].reverse).
      if (
        parentNode === ADDR_REVERSE_NODE &&
        context.chain.id === getENSRootChainId(config.namespace) &&
        // Sepolia V2 Tenderly Private RPC is rate-limiting the debug_traceTransaction calls so we
        // avoid addr.reverse healing for that namespace so indexing progresses smoothly
        // TODO: remove this once Sepolia V2 is decommissioned
        config.namespace !== ENSNamespaceIds.SepoliaV2
      ) {
        const label = await healAddrReverseSubnameLabel(context, event, labelHash);
        await ensureLabel(context, label);
      } else {
        await ensureUnknownLabel(context, labelHash);
      }
    }

    // NOTE: Canonicalize ENSv1Registry vs. ENSv1RegistryOld via `getManagedName(...).registry`.
    // Both Registries share a Managed Name (the ENS Root for mainnet) and write into the same
    // namegraph; canonicalizing here ensures Old events that pass `nodeIsMigrated` don't fragment
    // domains across two Registry IDs. This is why we use getManagedName over just `getThisAccountId`.
    const { registry } = getManagedName(getThisAccountId(context, event));

    const isTLD = parentNode === ENS_ROOT_NODE;
    const node = makeSubdomainNode(labelHash, parentNode);
    const domainId = makeENSv1DomainId(registry, node);

    // this ENSv1Domain's (parent) Registry is either:
    // a) if this is a TLD, the (concrete) ENSv1Registry identified by (chainId, address), or
    // b) the ENSv1VirtualRegistry identified by (chainId, address, parentNode)
    let parentRegistryId: RegistryId;
    if (isTLD) {
      parentRegistryId = makeENSv1RegistryId(registry);
      await ensureRegistry(context, parentRegistryId, { type: "ENSv1Registry", ...registry });
    } else {
      parentRegistryId = makeENSv1VirtualRegistryId(registry, parentNode);
      await ensureRegistry(context, parentRegistryId, {
        type: "ENSv1VirtualRegistry",
        ...registry,
        node: parentNode,
      });

      const parentDomainId = makeENSv1DomainId(registry, parentNode);

      // The bridged-resolver canonical edge owns both `Domain.subregistryId` on a bridge origin
      // (L1, e.g. mainnet `linea.eth` → L2 Lineanames Registry) and `Registry.canonicalDomainId`
      // on a bridged target (L2, e.g. Lineanames Registry → mainnet `linea.eth`). Chain-local
      // subname events would otherwise clobber whichever pointer matches the current chain:
      //   - L1 NewOwner for a subname of `linea.eth` would reset `linea.eth.subregistryId` to
      //     the mainnet virtual registry.
      //   - L2 NewOwner for any Lineaname subname would reset the L2 bridged Registry's
      //     `canonicalDomainId` to the L2-side `linea.eth` Domain.
      // Either clobber breaks the bidirectional agreement and de-canonicalizes the bridged
      // subtree. Skip the corresponding write when the parent matches a known bridge endpoint.

      // only update subregistry if this is not the origin domain
      if (!isBridgeOriginDomain(config.namespace, parentDomainId)) {
        await handleSubregistryUpdated(context, parentDomainId, parentRegistryId);
      }

      // only update canonical domain if this is not a target registry
      if (!isBridgedTargetRegistry(config.namespace, parentRegistryId)) {
        await handleRegistryCanonicalDomainUpdated(context, parentRegistryId, parentDomainId);
      }
    }

    const ownerId = interpretAddress(owner);
    await ensureAccount(context, owner);

    // ownerId/rootRegistryOwnerId are always set here despite being materialized from Registrars
    // (BaseRegistrar, NameWrapper) because (a) the root Registry is the source of truth even when
    // no Registrar is in use, and (b) Registrar events fire _after_ Registry events, so they
    // re-materialize over the value we set here.
    await context.ensDb
      .insert(ensIndexerSchema.domain)
      .values({
        id: domainId,
        type: "ENSv1Domain",
        registryId: parentRegistryId,
        node,
        labelHash,
        ownerId,
        rootRegistryOwnerId: ownerId,
      })
      .onConflictDoUpdate({ ownerId, rootRegistryOwnerId: ownerId });

    await ensureDomainInRegistry(context, parentRegistryId, domainId, labelHash);

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  async function handleTransfer({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{ node: Node; owner: NormalizedAddress }>;
  }) {
    const { node, owner } = event.args;

    // ENSv2 model does not include root node, no-op
    if (node === ENS_ROOT_NODE) return;

    const { registry } = getManagedName(getThisAccountId(context, event));
    const domainId = makeENSv1DomainId(registry, node);

    const ownerId = interpretAddress(owner);
    await ensureAccount(context, owner);

    // update domain, setting ownerId and rootRegistryOwner to the new owner
    // NOTE: despite Domain.ownerId being materialized from other sources of truth (i.e. Registrars
    // like BaseRegistrars & NameWrapper) it's ok to always set it here because the Registrar-emitted
    // events occur _after_ the Registry events. So when a name is wrapped, for example, the Registry's
    // owner changes to that of the NameWrapper but then the NameWrapper emits NameWrapped, and this
    // indexing code re-materializes the Domain.ownerId to the NameWrapper-emitted value.
    await context.ensDb
      .update(ensIndexerSchema.domain, { id: domainId })
      .set({ ownerId, rootRegistryOwnerId: ownerId });

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  async function handleNewTTL({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{ node: Node }>;
  }) {
    const { node } = event.args;

    // ENSv2 model does not include root node, no-op
    if (node === ENS_ROOT_NODE) return;

    const { registry } = getManagedName(getThisAccountId(context, event));
    const domainId = makeENSv1DomainId(registry, node);

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  async function handleNewResolver({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{ node: Node; resolver: NormalizedAddress }>;
  }) {
    const { node } = event.args;
    const resolver = interpretAddress(event.args.resolver);

    // ENSv2 model does not include root node, no-op
    if (node === ENS_ROOT_NODE) return;

    const { registry } = getManagedName(getThisAccountId(context, event));
    const domainId = makeENSv1DomainId(registry, node);

    // NOTE: Domain-Resolver relations are handled by the protocol-acceleration plugin and are not
    // directly indexed here

    // handle changes in resolver that could affect Bridged Resolver Canonical Domain edges
    await handleBridgedResolverChange(context, registry, domainId, resolver);

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv1RegistryOld:NewOwner"),
    async ({ context, event }) => {
      const { label: labelHash, node: parentNode } = event.args;

      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const shouldIgnoreEvent = await nodeIsMigratedByParentAndLabel(
        context,
        parentNode,
        labelHash,
      );
      if (shouldIgnoreEvent) return;

      return handleNewOwner({ context, event });
    },
  );

  /**
   * Handles Registry#Transfer for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv1RegistryOld:Transfer"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleTransfer({ context, event });
    },
  );

  /**
   * Handles Registry#NewTTL for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv1RegistryOld:NewTTL"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleNewTTL({ context, event });
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv1RegistryOld:NewResolver"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleNewResolver({ context, event });
    },
  );

  /**
   * Handles Registry events for:
   * - ENS Root Chain's (new) Registry
   * - Basenames Registry
   * - Lineanames Registry
   */
  addOnchainEventListener(namespaceContract(pluginName, "ENSv1Registry:NewOwner"), handleNewOwner);
  addOnchainEventListener(namespaceContract(pluginName, "ENSv1Registry:Transfer"), handleTransfer);
  addOnchainEventListener(namespaceContract(pluginName, "ENSv1Registry:NewTTL"), handleNewTTL);
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv1Registry:NewResolver"),
    handleNewResolver,
  );
}
