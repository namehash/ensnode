///
/// Shared Registry Handlers
///

import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { isLabelIndexable } from "@ensnode/utils/subname-helpers";
import { Address, getAddress, labelhash } from "viem";
import { EventWithArgs } from "../../../../lib/ponder-helpers";
import {
  labelHashToTokenId,
  makeContractId,
  makeLabelId,
  maskTokenId,
  materializeLabelName,
} from "../../v2-lib";

// NewSubname and DataStore events may arrive in any order
export async function handleNewSubname({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ label: string }>;
}) {
  console.table({ on: "NewSubname", ...event.args });
  const { label } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const tokenId = labelHashToTokenId(labelhash(label));
  const labelId = makeLabelId(registryId, tokenId);

  // ensure that this registry exists
  await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

  const indexableLabel = isLabelIndexable(label) ? label : null;

  await context.db
    .insert(schema.v2_label)
    // insert new Label with `label` value
    .values({
      id: labelId,
      registryId,
      tokenId,
      label: indexableLabel,
    })
    // or upsert existing Label's `label` value
    .onConflictDoUpdate({ label: indexableLabel });

  // materialize name field
  await materializeLabelName(context, labelId);
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
  console.table({ on: "URI", ...event.args });

  const { id, value: uri } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const tokenId = maskTokenId(id); // NOTE: ensure token id is masked
  const labelId = makeLabelId(registryId, tokenId);

  await context.db
    .insert(schema.v2_label)
    // insert new Label with uri
    .values({
      id: labelId,
      registryId,
      tokenId,
      uri,
    })
    // or update uri of existing Label
    .onConflictDoUpdate({ uri });
}

// ERC1155 Transfer events may arrive in any order
// TODO: correctly burn tokens
async function handleTransfer({
  context,
  event,
}: { context: Context; event: EventWithArgs<{ id: bigint; to: Address }> }) {
  console.table({ on: "handleTransfer", ...event.args });

  const { id, to } = event.args;

  const registryId = makeContractId(context.network.chainId, event.log.address);
  const tokenId = maskTokenId(id); // NOTE: ensures that the tokenId emitted is masked
  const labelId = makeLabelId(registryId, tokenId);
  const owner = getAddress(to); // NOTE: ensures that owner is checksummed

  await context.db
    .insert(schema.v2_label)
    // insert new Label with owner
    .values({
      id: labelId,
      registryId,
      tokenId,
      owner,
    })
    // or update owner of existing Label
    .onConflictDoUpdate({ owner });
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
