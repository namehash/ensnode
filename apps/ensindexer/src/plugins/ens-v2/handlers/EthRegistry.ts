import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { createDomainId, createEventId, generateTokenId, updateDomainLabel } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("EthRegistry:TransferSingle"), async ({ event, context }) => {
    console.log("EthRegistry:TransferSingle", event.transaction.to);
    const timestamp = event.block.timestamp;
    const labelHash = event.args.id.toString();
    const domainId = createDomainId(event.transaction.to?.toString(), labelHash);

    await context.db.insert(schema.v2_domain).values({
      id: domainId,
      labelHash: labelHash,
      owner: event.args.to.toString(),
      registry: event.transaction.to?.toString(),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Store the event data
    const eventId = createEventId(event);
    await context.db.insert(schema.v2_transferSingleEvent).values({
      id: eventId,
      registryId: event.transaction.to?.toString(),
      tokenId: event.args.id.toString(),
      from: event.args.from.toString(),
      to: event.args.to.toString(),
      value: event.args.value,
      source: "EthRegistry",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  ponder.on(namespace("EthRegistry:NewSubname"), async ({ event, context }) => {
    console.log("EthRegistry:NewSubname", event.transaction.to);
    const tokenId = generateTokenId(event.args.label);
    const registryId = event.transaction.to?.toString();
    const domainId = createDomainId(registryId, tokenId);

    await updateDomainLabel(
      context,
      domainId,
      event.args.label,
      tokenId,
      event.block.timestamp,
      event,
      "EthRegistry",
    );
  });
}
