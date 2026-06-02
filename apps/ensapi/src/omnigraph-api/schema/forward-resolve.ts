import type { JsonValue } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import { builder } from "@/omnigraph-api/builder";
import type { ResolvedRecordsResultModel } from "@/omnigraph-api/lib/resolution/records-profile-model";
import { DomainProfileRef } from "@/omnigraph-api/schema/profile";
import { ResolvedRecordsRef } from "@/omnigraph-api/schema/records";
import { AccelerationStatusRef } from "@/omnigraph-api/schema/resolution";

export type ForwardResolveModel = {
  accelerate: boolean;
  canAccelerate: boolean;
  trace: TracingTrace | null;
  result: ResolvedRecordsResultModel | null;
};

export const ForwardResolveRef = builder.objectRef<ForwardResolveModel>("ForwardResolve");

ForwardResolveRef.implement({
  description: "Nested domain resolution container exposing resolved data for the domain.",
  fields: (t) => ({
    trace: t.field({
      description:
        "Protocol trace tree emitted by resolution, represented as untyped JSON for schema stability. This data model should be expected to experience breaking changes.",
      type: "JSON",
      nullable: true,
      resolve: (parent) => parent.trace as unknown as JsonValue | null,
    }),
    acceleration: t.field({
      description: "Whether protocol acceleration was requested and attempted for this resolution.",
      type: AccelerationStatusRef,
      nullable: false,
      resolve: ({ accelerate, canAccelerate }) => ({
        requested: accelerate,
        attempted: accelerate && canAccelerate,
      }),
    }),
    records: t.field({
      description:
        "Resolved ENS records via the ENS protocol. Null when the name is not resolvable (non-canonical, unnormalized, or no records field was selected).",
      type: ResolvedRecordsRef,
      nullable: true,
      tracing: true,
      resolve: (parent) => parent.result,
    }),
    profile: t.field({
      description:
        "An interpreted profile for this name. Returns null when the name is not resolvable (non-canonical, unnormalized, or no profile records were selected).",
      type: DomainProfileRef,
      nullable: true,
      resolve: (parent) => parent.result,
    }),
  }),
});
