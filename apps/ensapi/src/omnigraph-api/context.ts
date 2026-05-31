import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";
import { inArray } from "drizzle-orm";
import type { DomainId, RegistryId } from "enssdk";

import di from "@/di";
import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";

/** Server context passed from Hono into GraphQL Yoga via `yoga.fetch(request, serverContext)`. */
export type OmnigraphYogaServerContext = CanAccelerateMiddlewareVariables;

const createRegistryParentDomainLoader = () =>
  new DataLoader<RegistryId, DomainId | null>(async (registryIds) => {
    const { ensDb, ensIndexerSchema } = di.context;
    const rows = await ensDb
      .select({
        id: ensIndexerSchema.registry.id,
        canonicalDomainId: ensIndexerSchema.registry.canonicalDomainId,
      })
      .from(ensIndexerSchema.registry)
      .where(inArray(ensIndexerSchema.registry.id, registryIds as RegistryId[]));
    const byId = new Map(rows.map((r) => [r.id, r.canonicalDomainId ?? null]));
    return registryIds.map((id) => byId.get(id) ?? null);
  });

/**
 * Constructs a new GraphQL Context per-request.
 *
 * @dev make sure that anything that is per-request (like dataloaders) are newly created in this fn
 */
export const createOmnigraphContext = (serverContext: OmnigraphYogaServerContext) => ({
  now: BigInt(getUnixTime(new Date())),
  loaders: {
    registryParentDomain: createRegistryParentDomainLoader(),
  },
  canAccelerate: serverContext.canAccelerate,
});

export type Context = ReturnType<typeof createOmnigraphContext>;
