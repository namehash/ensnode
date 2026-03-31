import { builder } from "@/graphql-api/builder";

/**
 * Input that requires one of `name` or `node`.
 */
export const NameOrNodeInput = builder.inputType("NameOrNodeInput", {
  description: "Constructs a reference to a specific Node via one of `name` or `node`.",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "Name" }),
    node: t.field({ type: "Node" }),
  }),
});
