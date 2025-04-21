import { Context } from "ponder:registry";
import schema from "ponder:schema";
import {
  makeSharedEventValues,
  upsertAccount,
  upsertDomain,
  upsertRegistration,
} from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeRegistrationId } from "@/lib/ids";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { LabelHash, Node, PluginName } from "@ensnode/utils";
import {
  decodeDNSPacketBytes,
  isLabelIndexable,
  makeSubdomainNode,
} from "@ensnode/utils/subname-helpers";
import { Address, Hex, hexToBytes, labelhash } from "viem";

/**
 * makes a set of shared handlers for a ThreeDNSToken contract
 */
export const makeThreeDNSTokenHandlers = ({ pluginName }: { pluginName: PluginName }) => {
  const sharedEventValues = makeSharedEventValues(pluginName);

  return {
    /**
     * In ThreeDNS, NewOwner is emitted when a (sub)domain is created. This includes TLDs, 2LDs, and
     * >2LDs. For 2LDs, however, RegistrationCreated is always emitted, and it's emitted first, so
     * this function must upsert a Domain that may have been created in `handleRegistrationCreated`.
     *
     * Finally, NewOwner can be emitted for the same Domain across chains — ThreeDNS allows registrations of
     * .xyz TLDs, for example, on both Optimism and Base, so this function must be idempotent along
     * that dimension as well.
     */
    handleNewOwner: async ({
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

      const domain = await upsertDomain(context, {
        id: node,
        ownerId: owner,
        parentId: parentNode,
        createdAt: event.block.timestamp,
        labelhash: labelHash,

        // NOTE: threedns has no concept of registry migration, so domains managed by this plugin
        // are always considered migrated
        isMigrated: true,
      });

      // if the domain doesn't yet have a name, attempt to construct it here
      // NOTE: for threedns this occurs on non-2LD `NewOwner` events, as a 2LD registration will
      // always emit `RegistrationCreated`, including Domain's `name`, before this `NewOwner` event
      // is indexed.
      if (!domain.name) {
        const parent = await context.db.find(schema.domain, { id: parentNode });

        // attempt to heal the label associated with labelHash via ENSRainbow
        const healedLabel = await labelByLabelHash(labelHash);
        const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

        // to construct `Domain.name` use the parent's name and the label value (encoded if not indexable)
        // NOTE: for a TLD, the parent is null, so we just use the label value as is
        const label = validLabel || encodeLabelhash(labelHash);
        const name = parent?.name ? `${label}.${parent.name}` : label;

        await context.db.update(schema.domain, { id: node }).set({ name, labelName: validLabel });
      }

      // log DomainEvent
      await context.db.insert(schema.newOwner).values({
        ...sharedEventValues(context.network.chainId, event),
        parentDomainId: parentNode,
        domainId: node,
        ownerId: owner,
      });
    },
    handleRegistrationCreated: async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        // NOTE: `node` event arg represents a `Node` that is the domain this registration is about
        node: Node;
        // NOTE: `tld` event arg represents a `Node` that is the parent of `node`
        tld: Node;
        // NOTE: `fqdn` event arg represents a Hex-encoded DNS Packet
        fqdn: Hex;
        registrant: Address;
        controlBitmap: number;
        expiry: bigint;
      }>;
    }) => {
      const { node, tld, fqdn, registrant, controlBitmap, expiry } = event.args;

      await upsertAccount(context, registrant);

      const [label, name] = decodeDNSPacketBytes(hexToBytes(fqdn));

      // Invariant: ThreeDNS always emits a valid DNS Packet
      if (!label || !name) {
        console.table({ ...event.args, tx: event.transaction.hash });
        throw new Error(`Expected valid DNSPacketBytes: "${fqdn}"`);
      }

      // Invariant: ThreeDNS validates that labels only use alphanumeric characters and hypens
      // https://github.com/3dns-xyz/contracts/blob/44937318ae26cc036982e8c6a496cd82ebdc2b12/src/regcontrol/modules/types/Registry.sol#L298
      if (!isLabelIndexable(label)) {
        console.table({ ...event.args, tx: event.transaction.hash });
        throw new Error(`Expected indexable label, got "${label}"`);
      }

      // Invariant: >2LDs never emit RegistrationCreated
      // TODO: is this invariant exactly correct? it seems to be, but unclear
      if (name.split(".").length > 2) {
        console.table({ ...event.args, tx: event.transaction.hash });
        throw new Error(`>2LD emitted RegistrationCreated: ${name}`);
      }

      console.log(`RegistrationCreated ${name}`);

      const labelHash = labelhash(label);

      // NOTE: we use upsert because RegistrationCreated can be emitted for the same domain upon
      // expiry and re-registration (example: delv.box)
      // 1st Registration: https://optimistic.etherscan.io/tx/0x16f31ccd9ce71b0e8f2068233b0aaa5739f48a23841ff5f813518afa144ee95e#eventlog
      // 2nd Registration: https://optimistic.etherscan.io/tx/0xcb0f17d98f86c44fed46b77e9528e153991cb03bd51723b3dbda43ff12039b2a#eventlog
      await upsertDomain(context, {
        id: node,
        parentId: tld,
        ownerId: registrant,
        registrantId: registrant,
        createdAt: event.block.timestamp,
        labelhash: labelHash,
        expiryDate: expiry,

        // include its decoded label/name
        labelName: label,
        name,
      });

      // upsert a Registration entity in response
      const registrationId = makeRegistrationId(pluginName, labelHash, node);
      await upsertRegistration(context, {
        id: registrationId,
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expiry,
        registrantId: registrant,
        labelName: label,
      });

      // log RegistrationEvent
      await context.db.insert(schema.nameRegistered).values({
        ...sharedEventValues(context.network.chainId, event),
        registrationId,
        registrantId: registrant,
        expiryDate: expiry,
      });
    },
    // async handleTransfer({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; owner: Address }>;
    // }) {
    //   const { node, owner } = event.args;

    //   await upsertAccount(context, owner);

    //   // ensure domain & update owner
    //   await context.db
    //     .insert(schema.domain)
    //     .values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
    //     .onConflictDoUpdate({ ownerId: owner });

    //   // garbage collect newly 'empty' domain iff necessary
    //   if (owner === zeroAddress) {
    //     await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
    //   }

    //   // log DomainEvent
    //   await context.db.insert(schema.transfer).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     ownerId: owner,
    //   });
    // },

    // async handleNewTTL({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; ttl: bigint }>;
    // }) {
    //   const { node, ttl } = event.args;

    //   // NOTE: the subgraph handles the case where the domain no longer exists, but domains are
    //   // never deleted, so we avoid implementing that check here
    //   // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L215

    //   await context.db.update(schema.domain, { id: node }).set({ ttl });

    //   // log DomainEvent
    //   await context.db.insert(schema.newTTL).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     ttl,
    //   });
    // },

    // async handleNewResolver({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; resolver: Address }>;
    // }) {
    //   const { node, resolver: resolverAddress } = event.args;

    //   const resolverId = makeResolverId(resolverAddress, node);

    //   const isZeroResolver = resolverAddress === zeroAddress;

    //   // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
    //   // NOTE: Resolver records are not deleted
    //   if (isZeroResolver) {
    //     await context.db
    //       .update(schema.domain, { id: node })
    //       .set({ resolverId: null, resolvedAddressId: null });

    //     // garbage collect newly 'empty' domain iff necessary
    //     await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
    //   } else {
    //     // otherwise upsert the resolver
    //     const resolver = await upsertResolver(context, {
    //       id: resolverId,
    //       domainId: node,
    //       address: resolverAddress,
    //     });

    //     // update the domain to point to it, and materialize the eth addr
    //     // NOTE: this implements the logic as documented here
    //     // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L193
    //     await context.db.update(schema.domain, { id: node }).set({
    //       resolverId,
    //       resolvedAddressId: resolver.addrId,
    //     });
    //   }

    //   // log DomainEvent
    //   await context.db.insert(schema.newResolver).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     // NOTE: this actually produces a bug in the subgraph's graphql layer — `resolver` is not nullable
    //     // but there is never a resolver record created for the zeroAddress. so if you query the
    //     // `resolver { id }` of a NewResolver event that set the resolver to zeroAddress
    //     // ex: newResolver(id: "3745840-2") { id resolver {id} }
    //     // you will receive a GraphQL type error. for subgraph compatibility we re-implement this
    //     // behavior here, but it should be entirely avoided in a v2 restructuring of the schema.
    //     resolverId: isZeroResolver ? zeroAddress : resolverId,
    //   });
    // },
  };
};
