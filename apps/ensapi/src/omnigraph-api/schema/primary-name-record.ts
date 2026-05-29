import { type Address, type CoinType, type InterpretedName, isNormalizedName } from "enssdk";

import { resolveForward } from "@/lib/resolution/forward-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { builder } from "@/omnigraph-api/builder";
import type { ENSIP19ChainValue } from "@/omnigraph-api/lib/resolution/chain-coin-type";
import { toResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";
import { buildRecordsSelectionFromResolveContainerInfo } from "@/omnigraph-api/lib/resolution/records-selection";
import { CanonicalNameRef } from "@/omnigraph-api/schema/canonical-name";
import { ENSIP19Chain } from "@/omnigraph-api/schema/resolution";
import { type ResolveModel, ResolveRef } from "@/omnigraph-api/schema/resolve";

export type PrimaryNameRecordModel = {
  address: Address;
  coinType: CoinType;
  chain: ENSIP19ChainValue | null;
  name: InterpretedName | null;
};

/** GraphQL parent for `PrimaryNameRecord`, including `AccountResolve` acceleration settings. */
export type PrimaryNameRecordParent = PrimaryNameRecordModel & {
  accelerate: boolean;
};

export const PrimaryNameRecordRef = builder.objectRef<PrimaryNameRecordParent>("PrimaryNameRecord");

PrimaryNameRecordRef.implement({
  description: "An ENSIP-19 primary name for an Account on a specific coin type.",
  fields: (t) => ({
    coinType: t.field({
      description: "The canonical ENSIP-9 coin type for this primary name lookup.",
      type: "CoinType",
      nullable: false,
      resolve: (r) => r.coinType,
    }),
    chain: t.field({
      description:
        "The ENSIP-19 chain corresponding to `coinType`, or null when `coinType` is not represented in `ENSIP19Chain`.",
      type: ENSIP19Chain,
      nullable: true,
      resolve: (r) => r.chain,
    }),
    name: t.field({
      description:
        "The validated primary name for this Account on this coin type, or null if none is set.",
      type: CanonicalNameRef,
      nullable: true,
      resolve: (r) => r.name ?? null,
    }),
    resolve: t.field({
      description:
        "Resolve protocol-level records (and optionally profile preview) for this primary name.",
      type: ResolveRef,
      nullable: false,
      resolve: async (parent, _args, context, info): Promise<ResolveModel> => {
        const { name, accelerate } = parent;
        const { canAccelerate } = context;

        if (!name || !isNormalizedName(name)) {
          return { accelerate, canAccelerate, trace: null, records: null };
        }

        const recordsSelection = buildRecordsSelectionFromResolveContainerInfo(info);
        if (!recordsSelection) {
          return { accelerate, canAccelerate, trace: null, records: null };
        }

        const { trace, result } = await runWithTrace(() =>
          resolveForward(name, recordsSelection, { accelerate, canAccelerate }),
        );

        return {
          accelerate,
          canAccelerate,
          trace,
          records: toResolvedRecordsModel(name, result),
        };
      },
    }),
  }),
});
