import { builder } from "@/omnigraph-api/builder";
import { CHAIN_NAME_VALUES } from "@/omnigraph-api/lib/resolution/chain-coin-type";

//////////////////////
// AccelerationStatus
//////////////////////
export type AccelerationStatusModel = {
  requested: boolean;
  attempted: boolean;
};

export const AccelerationStatusRef =
  builder.objectRef<AccelerationStatusModel>("AccelerationStatus");

AccelerationStatusRef.implement({
  description: "Execution status metadata for a resolver strategy.",
  fields: (t) => ({
    requested: t.field({
      type: "Boolean",
      description: "Whether protocol acceleration was requested by the caller.",
      nullable: false,
      resolve: (parent) => parent.requested,
    }),
    attempted: t.field({
      type: "Boolean",
      description: "Whether protocol acceleration was attempted at runtime.",
      nullable: false,
      resolve: (parent) => parent.attempted,
    }),
  }),
});

//////////////////
// ChainName
//////////////////
export const ChainName = builder.enumType("ChainName", {
  description:
    "The names of chains that the Omnigraph API supports identifying by name as a syntactic convenience. The Omnigraph API supports identification of additional chains beyond this list, but those chains must be identified through other mechanisms such as `coinType` or `chainId`.",
  values: CHAIN_NAME_VALUES,
});

///////////////////////
// PrimaryName inputs
///////////////////////
export const PrimaryNameByInput = builder.inputType("PrimaryNameByInput", {
  description:
    "Select a primary name lookup target. Exactly one of `coinType` or `chainName` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinType: t.field({
      type: "CoinType",
      description: "The ENSIP-9 coin type to resolve the primary name for.",
    }),
    chainName: t.field({
      type: ChainName,
      description: "A `ChainName` to resolve the primary name for.",
    }),
  }),
});

export type PrimaryNameByInputValue = typeof PrimaryNameByInput.$inferInput;

export const PrimaryNamesWhereInput = builder.inputType("PrimaryNamesWhereInput", {
  description:
    "Filter primary name lookups. Exactly one of `coinTypes` or `chainNames` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinTypes: t.field({
      type: ["CoinType"],
      description: "Coin types to resolve primary names for.",
      validate: { minLength: 1 },
    }),
    chainNames: t.field({
      type: [ChainName],
      description: "`ChainName` values to resolve primary names for.",
      validate: { minLength: 1 },
    }),
  }),
});

export type PrimaryNamesWhereInputValue = typeof PrimaryNamesWhereInput.$inferInput;
