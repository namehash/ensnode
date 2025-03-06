import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { createDomainId, createEventId, generateTokenId, updateDomainLabel } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("RootRegistry:TransferSingle"), async ({ event, context }) => {
    const timestamp = event.block.timestamp;
    const tokenId = event.args.id.toString();
    const registryId = event.transaction.to?.toString();
    const domainId = createDomainId(registryId, tokenId);
    const values = {
      id: domainId,
      labelHash: tokenId,
      owner: event.args.to.toString(),
      registry: registryId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    console.log("RootRegistry:TransferSingle", values);
    await context.db.insert(schema.v2_domain).values(values);
    // Store the event data
    const eventId = createEventId(event);
    await context.db.insert(schema.v2_transferSingleEvent).values({
      id: eventId,
      registryId: registryId,
      tokenId: tokenId,
      from: event.args.from.toString(),
      to: event.args.to.toString(),
      value: event.args.value,
      source: "RootRegistry",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  ponder.on(namespace("RootRegistry:NewSubname"), async ({ event, context }) => {
    console.log("RootRegistry:NewSubname", event.transaction.to);
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
      "RootRegistry",
    );
  });
}
