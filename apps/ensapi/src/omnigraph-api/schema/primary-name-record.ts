import { type Address, type CoinType, type InterpretedName, isNormalizedName } from "enssdk";

import { resolveForward } from "@/lib/resolution/forward-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { builder } from "@/omnigraph-api/builder";
import type { ChainNameValue } from "@/omnigraph-api/lib/resolution/chain-coin-type";
import { toResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";
import { buildRecordsSelectionFromResolveContainerInfo } from "@/omnigraph-api/lib/resolution/records-selection";
import { CanonicalNameRef } from "@/omnigraph-api/schema/canonical-name";
import {
  type ForwardResolveModel,
  ForwardResolveRef,
} from "@/omnigraph-api/schema/forward-resolve";
import { ChainName } from "@/omnigraph-api/schema/resolution";

export type PrimaryNameRecordModel = {
  address: Address;
  coinType: CoinType;
  chainName: ChainNameValue | null;
  name: InterpretedName | null;
};

/** GraphQL parent for `PrimaryNameRecord`, including `ReverseResolve` acceleration settings. */
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
    chainName: t.field({
      description:
        "The chain corresponding to `coinType`, or null when `coinType` is not represented in `ChainName`.",
      type: ChainName,
      nullable: true,
      resolve: (r) => r.chainName,
    }),
    name: t.field({
      description:
        "The validated primary name for this Account on this coin type, or null if none is set.",
      type: CanonicalNameRef,
      nullable: true,
      resolve: (r) => r.name ?? null,
    }),
    resolve: t.field({
      description: "Forward resolve data for this primary name.",
      type: ForwardResolveRef,
      nullable: false,
      resolve: async (parent, _args, context, info): Promise<ForwardResolveModel> => {
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
