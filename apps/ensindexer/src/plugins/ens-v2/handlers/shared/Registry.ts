///
/// Shared Registry Handlers
///

import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { isLabelIndexable } from "@ensnode/utils/subname-helpers";
import { Address, getAddress, labelhash, zeroAddress } from "viem";
import { EventWithArgs } from "../../../../lib/ponder-helpers";
import { labelHashToTokenId, makeContractId, makeDomainId, maskTokenId } from "../../v2-lib";

// NewSubname and DataStore events may arrive in any order
export async function handleNewSubname({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ label: string }>;
}) {
  const { label } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const tokenId = labelHashToTokenId(labelhash(label));
  const maskedTokenId = maskTokenId(tokenId);
  const domainId = makeDomainId(registryId, maskedTokenId);

  console.table({ on: "NewSubname", registryId, tokenId, domainId });

  // ensure that this registry exists
  await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

  const indexableLabel = isLabelIndexable(label) ? label : null;

  await context.db
    .insert(schema.v2_domain)
    // insert new Domain with `label` value
    .values({
      id: domainId,
      registryId,
      tokenId,
      maskedTokenId,
      label: indexableLabel,
    })
    // or upsert existing Domain's `label` value
    .onConflictDoUpdate({
      label: indexableLabel,
      // NOTE: we enforce that tokenId is set here to avoid event-order issues specified in RegistryDatastore
      tokenId,
    });
}

export async function handleURI({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    id: bigint;
    value: string;
  }>;
}) {
  const { id: tokenId, value: uri } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const maskedTokenId = maskTokenId(tokenId);
  const domainId = makeDomainId(registryId, maskedTokenId);

  console.table({ on: "URI", registryId, tokenId, domainId, uri });

  await context.db
    .insert(schema.v2_domain)
    // insert new Domain with uri
    .values({
      id: domainId,
      registryId,
      tokenId,
      maskedTokenId,
      uri,
    })
    // or update uri of existing Domain
    .onConflictDoUpdate({
      uri,
      // NOTE: we enforce that tokenId is set here to avoid event-order issues specified in RegistryDatastore
      tokenId,
    });
}

// ERC1155 Transfer events may arrive in any order
async function handleTransfer({
  context,
  event,
}: { context: Context; event: EventWithArgs<{ id: bigint; to: Address }> }) {
  const { id: tokenId, to } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const maskedTokenId = maskTokenId(tokenId);
  const domainId = makeDomainId(registryId, maskedTokenId);
  const owner = getAddress(to); // NOTE: ensures that owner is checksummed

  console.table({ on: "handleTransfer", registryId, tokenId, domainId, owner });

  const isBurn = owner === zeroAddress;
  if (isBurn) {
    // to remove a Domain from the tree, we need only delete the Domain entity
    // NOTE(registry-domain-uniq): we must also remove the reverse relationship on its subregistry
    //  because we store that information bi-directionally
    const domain = await context.db.find(schema.v2_domain, { id: domainId });
    if (domain?.subregistryId) {
      await context.db
        .update(schema.v2_registry, { id: domain.subregistryId })
        .set({ domainId: null });
    }

    // delete the relevant Domain entity, removing it and its subtree from the namespace
    await context.db.delete(schema.v2_domain, { id: domainId });
  } else {
    // this is a mint or update event
    await context.db
      .insert(schema.v2_domain)
      // insert new Domain with owner
      .values({
        id: domainId,
        registryId,
        tokenId,
        maskedTokenId,
        owner,
      })
      // or update owner of existing Domain
      .onConflictDoUpdate({
        owner,
        // NOTE: we enforce that tokenId is set here to avoid event-order issues specified in RegistryDatastore
        tokenId,
      });
  }
}

export async function handleTransferSingle({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ id: bigint; to: Address }>;
}) {
  await handleTransfer({ context, event });
}

export async function handleTransferBatch({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ ids: readonly bigint[]; to: Address }>;
}) {
  for (const [i, id] of event.args.ids.entries()) {
    await handleTransfer({
      context,
      event: {
        ...event,
        args: {
          id,
          to: event.args.to,
        },
      },
    });
  }
}
