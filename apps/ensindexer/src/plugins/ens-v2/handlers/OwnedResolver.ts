import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("OwnedResolver:AddressChanged"), async ({ event, context }) => {
    const timestamp = event.block.timestamp;
    const resolverId = event.transaction.to?.toString();
    if (!resolverId) return;

    console.log("OwnedResolver:AddressChanged", event.args, resolverId);
    const record = await context.db.find(schema.v2_resolver, { id: resolverId });
    if (record) {
      console.log("OwnedResolver:AddressChanged", "Record found", record);
      await context.db.update(schema.v2_resolver, { id: record.id }).set({
        ...record,
        address: event.args.newAddress.toString(),
        updatedAt: timestamp,
        node: event.args.node.toString(),
      });
    } else {
      console.log("OwnedResolver:AddressChanged", "No record found");
    }
  });
}
