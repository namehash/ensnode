import type { JsonValue } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import { builder } from "@/omnigraph-api/builder";
import { INCLUDE_DEV_METHODS } from "@/omnigraph-api/lib/include-dev-methods";
import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";
import { DomainProfileRef } from "@/omnigraph-api/schema/profile";
import { ResolvedRecordsRef } from "@/omnigraph-api/schema/records";
import { AccelerationStatusRef } from "@/omnigraph-api/schema/resolution";

export type ResolveModel = {
  accelerate: boolean;
  canAccelerate: boolean;
  trace: TracingTrace | null;
  records: ResolvedRecordsModel | null;
};

export const ResolveRef = builder.objectRef<ResolveModel>("Resolve");

ResolveRef.implement({
  description:
    "Nested domain resolution container exposing resolved data for the domain.",
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
      resolve: (parent) => parent.records,
    }),
    ...(INCLUDE_DEV_METHODS && {
      profile: t.field({
        description:
          "PREVIEW: An interpreted ENS profile for this Domain. Types are defined for query ergonomics; resolution is not yet wired. Returns null when the domain is not canonical or normalized.",
        type: DomainProfileRef,
        nullable: true,
        resolve: (parent) => (parent.records ? {} : null),
      }),
    }),
  }),
});
