import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { createEventId } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  ponder.on(namespace("RegistryDatastore:SubregistryUpdate"), async ({ context, event }) => {
    console.log("RegistryDatastore:SubregistryUpdate", event.args);
    const timestamp = event.block.timestamp;
    await context.db.insert(schema.v2_registry).values({
      id: event.args.registry.toString(),
      labelHash: event.args.labelHash.toString(),
      subregistryId: event.args.subregistry,
      flags: event.args.flags,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    console.log(event);
    const eventId = createEventId(event);
    await context.db.insert(schema.v2_subregistryUpdateEvent).values({
      id: eventId,
      registryId: event.args.registry.toString(),
      labelHash: event.args.labelHash.toString(),
      subregistryId: event.args.subregistry,
      flags: event.args.flags,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  ponder.on(namespace("RegistryDatastore:ResolverUpdate"), async ({ context, event }) => {
    console.log("RegistryDatastore:ResolverUpdate", event.args);
    const timestamp = event.block.timestamp;
    const record2 = await context.db.find(schema.v2_registry, {
      id: event.args.registry.toString(),
    });
    if (record2) {
      console.log("RegistryDatastore:ResolverUpdate", "Record found", record2);
      await context.db
        .update(schema.v2_registry, { id: record2.id })
        .set({ ...record2, resolver: event.args.resolver.toString() });

      const record3 = await context.db.find(schema.v2_resolver, {
        id: event.args.resolver.toString(),
      });
      if (!record3) {
        console.log("RegistryDatastore:ResolverUpdate", "Creating new resolver record");
        await context.db.insert(schema.v2_resolver).values({
          id: event.args.resolver.toString(),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    } else {
      console.log("RegistryDatastore:ResolverUpdate", "No record found");
    }

    // Store the event data
    const eventId = createEventId(event);
    await context.db.insert(schema.v2_resolverUpdateEvent).values({
      id: eventId,
      registryId: event.args.registry.toString(),
      labelHash: event.args.labelHash.toString(),
      resolverId: event.args.resolver.toString(),
      flags: event.args.flags,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
}
