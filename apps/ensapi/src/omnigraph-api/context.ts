import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";
import { inArray } from "drizzle-orm";
import type { CoinType, DomainId, NormalizedAddress, RegistryId } from "enssdk";

import type { ReverseResolutionResult, TracingTrace } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
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
 * Loads the ENSIP-19 Primary Name for an `(account, coinType)` via reverse resolution, deduplicating
 * identical pairs within a request. Backs `NameReference.match`, where a page of NameReferences
 * sharing one `(account, coinType)` would otherwise each run an independent reverse resolution.
 */
const createReverseResolutionLoader = (canAccelerate: boolean) =>
  new DataLoader<
    { account: NormalizedAddress; coinType: CoinType },
    { trace: TracingTrace; result: ReverseResolutionResult },
    string
  >(
    (keys) =>
      Promise.all(
        // runWithTrace establishes the tracing context the reverse-resolution protocol steps
        // require; the trace is passed through and discarded at the callsite.
        keys.map(({ account, coinType }) =>
          runWithTrace(() =>
            resolveReverse(account, coinType, { accelerate: true, canAccelerate }),
          ),
        ),
      ),
    { cacheKeyFn: ({ account, coinType }) => `${account}:${coinType}` },
  );

/**
 * Constructs a new GraphQL Context per-request.
 *
 * @dev make sure that anything that is per-request (like dataloaders) are newly created in this fn
 */
export const createOmnigraphContext = (serverContext: OmnigraphYogaServerContext) => ({
  now: BigInt(getUnixTime(new Date())),
  loaders: {
    registryParentDomain: createRegistryParentDomainLoader(),
    reverseResolution: createReverseResolutionLoader(serverContext.canAccelerate),
  },
  canAccelerate: serverContext.canAccelerate,
});

export type Context = ReturnType<typeof createOmnigraphContext>;
