import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { Address, Hex, hexToBigInt, hexToBytes, labelhash, zeroAddress, zeroHash } from "viem";

import {
  type LabelHash,
  type Node,
  isLabelIndexable,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";

import {
  sharedEventValues,
  upsertAccount,
  upsertDomain,
  upsertDomainResolverRelation,
  upsertRegistration,
  upsertResolver,
} from "@/lib/db-helpers";
import { decodeDNSPacketBytes } from "@/lib/dns-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeDomainResolverRelationId, makeRegistrationId, makeResolverId } from "@/lib/ids";
import { parseLabelAndNameFromOnChainMetadata } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { recursivelyRemoveEmptyDomainFromParentSubdomainCount } from "@/lib/subgraph-helpers";

/**
 * Gets the `uri` for a given tokenId using the relevant ThreeDNSToken from `context`
 */
const getUriForTokenId = async (context: Context, tokenId: bigint): Promise<string> => {
  // ThreeDNSToken is network-specific in ponder multi-network usage
  // https://ponder.sh/docs/indexing/read-contract-data#multiple-networks
  return context.client.readContract({
    abi: context.contracts["threedns/ThreeDNSToken"].abi,
    address: context.contracts["threedns/ThreeDNSToken"].address,
    functionName: "uri",
    args: [tokenId],
  });
};

/**
 * In ThreeDNS, NewOwner is emitted when a (sub)domain is created. This includes TLDs, 2LDs, and
 * >2LDs. For 2LDs, however, RegistrationCreated is always emitted, and it's emitted first, so
 * this function must upsert a Domain that may have been created in `handleRegistrationCreated`.
 *
 * Finally, NewOwner can be emitted for the same Domain across chains — ThreeDNS allows registrations of
 * .xyz TLDs, for example, on both Optimism and Base, so this function must be idempotent along
 * that dimension as well.
 */
export async function handleNewOwner({
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
}) {
  const { label: labelHash, node: parentNode, owner } = event.args;

  await upsertAccount(context, owner);

  // the domain in question is a subdomain of `parentNode`
  const node = makeSubdomainNode(labelHash, parentNode);
  let domain = await context.db.find(schema.domain, { id: node });

  // in ThreeDNS there's a hard-coded Resolver that all domains use
  const resolverId = makeResolverId(
    context.network.chainId,
    // NetworkConfig#address is `Address | undefined`, but we know this is defined for 3DNS' Resolver
    context.contracts["threedns/Resolver"].address!,
    node,
  );

  // so upsert the resolver record and link Domain.resolverId below
  await upsertResolver(context, {
    id: resolverId,
    address: context.contracts["threedns/Resolver"].address!,
    domainId: node,
  });

  if (domain) {
    // if the domain already exists, this is just an update of the owner record
    domain = await context.db.update(schema.domain, { id: node }).set({ ownerId: owner });
  } else {
    // otherwise create the domain
    domain = await context.db.insert(schema.domain).values({
      id: node,
      ownerId: owner,
      parentId: parentNode,
      createdAt: event.block.timestamp,
      labelhash: labelHash,

      // NOTE: threedns has no concept of registry migration, so domains indexed by this plugin
      // are always considered 'migrated'
      isMigrated: true,
    });

    // and increment parent subdomainCount
    await context.db
      .update(schema.domain, { id: parentNode })
      .set((row) => ({ subdomainCount: row.subdomainCount + 1 }));
  }

  // NOTE(resolver-relations): link Domain and Resolver on this chain
  await upsertDomainResolverRelation(context, {
    id: makeDomainResolverRelationId(context.network.chainId, node),
    chainId: context.network.chainId,
    domainId: node,
    resolverId,
  });

  // if the domain doesn't yet have a name, attempt to construct it here
  // NOTE: for threedns this occurs on non-2LD `NewOwner` events, as a 2LD registration will
  // always emit `RegistrationCreated`, including Domain's `name`, before this `NewOwner` event
  // is indexed.
  if (!domain.name) {
    const parent = await context.db.find(schema.domain, { id: parentNode });

    let healedLabel = null;

    // 1. attempt metadata retrieval
    if (!healedLabel) {
      const tokenId = hexToBigInt(node, { size: 32 });
      const uri = await getUriForTokenId(context, tokenId);
      [healedLabel] = parseLabelAndNameFromOnChainMetadata(uri);
    }

    // 2. attempt to heal the label associated with labelHash via ENSRainbow
    if (!healedLabel) {
      healedLabel = await labelByLabelHash(labelHash);
    }

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
}

export async function handleTransfer({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; owner: Address }>;
}) {
  const { node, owner } = event.args;

  await upsertAccount(context, owner);

  // update owner (Domain is guaranteed to exist because NewOwner fires before Transfer)
  await context.db.update(schema.domain, { id: node }).set({ ownerId: owner });

  // garbage collect newly 'empty' domain iff necessary
  if (owner === zeroAddress) {
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  }

  // log DomainEvent
  await context.db.insert(schema.transfer).values({
    ...sharedEventValues(context.network.chainId, event),
    domainId: node,
    ownerId: owner,
  });
}

export async function handleRegistrationCreated({
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
}) {
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

  // upsert a Registration entity
  const registrationId = makeRegistrationId(labelHash, node);
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
}

export async function handleRegistrationExtended({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; duration: bigint; newExpiry: bigint }>;
}) {
  const { node, duration, newExpiry } = event.args;

  // update domain expiry date
  await context.db.update(schema.domain, { id: node }).set({ expiryDate: newExpiry });

  // udpate registration expiry date
  const registrationId = makeRegistrationId(zeroHash, node);
  await context.db
    .update(schema.registration, { id: registrationId })
    .set({ expiryDate: newExpiry });

  // log RegistratioEvent
  await context.db.insert(schema.nameRenewed).values({
    ...sharedEventValues(context.network.chainId, event),
    registrationId,
    expiryDate: newExpiry,
  });
}
