// export the gql.tada subset of enssdk/omnigraph so consumers only need the one dependency
export type { FragmentOf, ResultOf, VariablesOf } from "enssdk/omnigraph";
export { readFragment } from "enssdk/omnigraph";

export * from "./components";
export * from "./graphql";
export * from "./hooks";
export * from "./provider";
