import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, isAddressEqual, labelhash, zeroAddress, zeroHash } from "viem";

import {
  DNSEncodedLiteralName,
  DNSEncodedName,
  InterpretedLabel,
  InterpretedName,
  Label,
  type LabelHash,
  LiteralLabel,
  type Node,
  decodeDNSEncodedLiteralName,
  encodeLabelHash,
  interpretedLabelsToInterpretedName,
  isNormalizedLabel,
  labelhashLiteralLabel,
  literalLabelToInterpretedLabel,
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
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeDomainResolverRelationId, makeRegistrationId, makeResolverId } from "@/lib/ids";
import { parseLabelAndNameFromOnChainMetadata } from "@/lib/json-metadata";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { recursivelyRemoveEmptyDomainFromParentSubdomainCount } from "@/lib/subgraph-helpers";
import { getThreeDNSTokenId } from "@/lib/threedns-helpers";

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
 * Decodes ThreeDNSToken's emitted DNS-Encoded Name `fqdn` into an Interpreted Name and its first
 * Interpreted Label.
 */
function decodeFQDN(fqdn: DNSEncodedLiteralName): {
  labelHash: LabelHash;
  label: InterpretedLabel;
  name: InterpretedName;
} {
  // Invariant: ThreeDNS always emits a decodable DNS Packet (`decodeDNSEncodedLiteralName` throws)
  // https://github.com/3dns-xyz/contracts/blob/44937318ae26cc036982e8c6a496cd82ebdc2b12/src/regcontrol/modules/types/Registry.sol#L298
  const literalLabels = decodeDNSEncodedLiteralName(fqdn);

  // Invariant: ThreeDNSToken doesn't try to register the root node
  if (literalLabels.length === 0) {
    throw new Error(
      `Invariant: ThreeDNSToken emitted ${fqdn} that decoded to root node (empty string).`,
    );
  }

  // Invariant: ThreeDNSToken only emits normalized labels
  // https://github.com/3dns-xyz/contracts/blob/44937318ae26cc036982e8c6a496cd82ebdc2b12/src/regcontrol/modules/types/Registry.sol#L298
  if (!literalLabels.every(isNormalizedLabel)) {
    throw new Error(
      `Invariant: ThreeDNSToken emitted ${fqdn} that included some unnormalized labels: [${literalLabels.join(", ")}].`,
    );
  }

  // due the invariant above, we know that all of the labels are normalized (and therefore Interpreted Labels)
  const interpretedLabels = literalLabels as string[] as InterpretedLabel[];

  return {
    labelHash: labelhashLiteralLabel(literalLabels[0]!), // ! ok due to length invariant above
    label: interpretedLabels[0]!, // ! ok due to length invariant above
    name: interpretedLabelsToInterpretedName(interpretedLabels),
  };
}

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
  if (domain.name === null) {
    const parent = await context.db.find(schema.domain, { id: parentNode });

    // 1. attempt metadata retrieval
    const tokenId = getThreeDNSTokenId(node);
    const uri = await getUriForTokenId(context, tokenId);
    let [healedLabel] = parseLabelAndNameFromOnChainMetadata(uri);

    // 2. attempt to heal the label associated with labelHash via ENSRainbow
    if (healedLabel === null) {
      healedLabel = await labelByLabelHash(labelHash);
    }

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
    const interpretedName = (
      parent?.name ? `${interpretedLabel}.${parent.name}` : interpretedLabel
    ) as InterpretedName;

    await context.db
      .update(schema.domain, { id: node })
      .set({ name: interpretedName, labelName: interpretedLabel });
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
    fqdn: DNSEncodedName;
    registrant: Address;
    controlBitmap: number;
    expiry: bigint;
  }>;
}) {
  const { node, tld, fqdn, registrant, controlBitmap, expiry } = event.args;

  await upsertAccount(context, registrant);

  // NOTE: ThreeDNSToken emits a DNS-Encoded LiteralName, so we cast the DNSEncodedName as such
  const { labelHash, label, name } = decodeFQDN(fqdn as DNSEncodedLiteralName);

  // Invariant: ThreeDNSToken only emits RegistrationCreated for TLDs or 2LDs
  if (name.split(".").length >= 3) {
    console.table({ ...event.args, tx: event.transaction.hash });
    throw new Error(`Invariant: >2LD emitted RegistrationCreated: ${name}`);
  }

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
