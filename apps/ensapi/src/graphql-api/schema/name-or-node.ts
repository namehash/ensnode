import { builder } from "@/graphql-api/builder";

/**
 * Input that requires one of `name` or `node`.
 */
export const NameOrNodeInput = builder.inputType("NameOrNodeInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "Name" }),
    node: t.field({ type: "Node" }),
  }),
});
