import { builder } from "@/omnigraph-api/builder";

/**
 * Input that requires one of `name` or `node`.
 */
export const NameOrNodeInput = builder.inputType("NameOrNodeInput", {
  description: "Constructs a reference to a specific Node via one of `name` or `node`.",
  isOneOf: true,
  fields: (t) => ({
    name: t.field({ type: "InterpretedName" }),
    node: t.field({ type: "Node" }),
  }),
});
