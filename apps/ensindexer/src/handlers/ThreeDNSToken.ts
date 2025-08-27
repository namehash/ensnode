import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, Hex, hexToBigInt, hexToBytes, labelhash, zeroAddress, zeroHash } from "viem";

import {
  type LabelHash,
  type Node,
  encodeLabelHash,
  interpretLabel,
  interpretName,
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
import { parseLabelAndNameFromOnChainMetadata } from "@/lib/json-metadata";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { recursivelyRemoveEmptyDomainFromParentSubdomainCount } from "@/lib/subgraph-helpers";

/**
 * Gets the `uri` for a given tokenId using the relevant ThreeDNSToken from `context`
 */
const getUriForTokenId = async (context: Context, tokenId: bigint): Promise<string> => {
  // ThreeDNSToken is chain-specific in ponder multi-chain usage
  // https://ponder.sh/docs/indexing/read-contracts#multiple-chains
  return context.client.readContract({
    abi: context.contracts["threedns/ThreeDNSToken"].abi,
    // NetworkConfig#address is `Address | Address[] | undefined`, but we know this is a single address
    address: context.contracts["threedns/ThreeDNSToken"].address! as Address,
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

  // NetworkConfig#address is `Address | Address[] | undefined`, but we know this is a single address
  const resolverAddress = context.contracts["threedns/Resolver"].address! as Address;

  // in ThreeDNS there's a hard-coded Resolver that all domains use
  // so upsert the resolver record and link Domain.resolverId below
  const resolverId = makeResolverId(context.chain.id, resolverAddress, node);
  await upsertResolver(context, {
    id: resolverId,
    address: resolverAddress,
    domainId: node,
  });

  if (domain) {
    // if the domain already exists, this is just an update of the owner record
    domain = await context.db.update(schema.domain, { id: node }).set({ ownerId: owner });

    // NOTE(resolver-relations): link Domain and Resolver on this chain
    await upsertDomainResolverRelation(context, {
      id: makeDomainResolverRelationId(context.chain.id, node),
      chainId: context.chain.id,
      domainId: node,
      resolverId,
    });
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

  // if the domain doesn't yet have a name, attempt to construct it here
  // NOTE: for threedns this occurs on non-2LD `NewOwner` events, as a 2LD registration will
  // always emit `RegistrationCreated`, including Domain's `name`, before this `NewOwner` event
  // is indexed.
  if (!domain.name) {
    const parent = await context.db.find(schema.domain, { id: parentNode });

    let healedLabel: string | null = null;

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

    // NOTE(replace-unnormalized): ensure we have a valid label, falling back to the known labelHash
    // that was emitted otherwise
    const label = interpretLabel(healedLabel) ?? encodeLabelHash(labelHash);

    // to construct `Domain.name` use the parent's Name and the valid Label
    // NOTE: for a TLD, the parent is null, so we just use the Label value as is
    const name = parent?.name ? `${label}.${parent.name}` : label;

    await context.db.update(schema.domain, { id: node }).set({ name, labelName: label });
  }

  // log DomainEvent
  await context.db.insert(schema.newOwner).values({
    ...sharedEventValues(context.chain.id, event),
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
    ...sharedEventValues(context.chain.id, event),
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

  const [_label, _name] = decodeDNSPacketBytes(hexToBytes(fqdn));
  const name = interpretName(_name);
  const label = interpretLabel(_label);

  // Invariant: ThreeDNS always emits a valid DNS Packet and valid label/name
  // NOTE(replace-unnormalized): this is redundant because we know ThreeDNS always emits labels with
  // alphanumeric characters and hypens, which always results in a valid label and name, but we
  // explicitly enforce this behavior here for consistency.
  //
  // https://github.com/3dns-xyz/contracts/blob/44937318ae26cc036982e8c6a496cd82ebdc2b12/src/regcontrol/modules/types/Registry.sol#L298
  if (!label || !name) {
    console.table({ ...event.args, tx: event.transaction.hash });
    throw new Error(`Invariant: expected valid DNSPacketBytes: "${fqdn}"`);
  }

  // Invariant: ThreeDNSToken only emits RegistrationCreated for TLDs or 2LDs
  if (name.split(".").length > 2) {
    console.table({ ...event.args, tx: event.transaction.hash });
    throw new Error(`Invariant: >2LD emitted RegistrationCreated: ${name}`);
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
    ...sharedEventValues(context.chain.id, event),
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
    ...sharedEventValues(context.chain.id, event),
    registrationId,
    expiryDate: newExpiry,
  });
}
