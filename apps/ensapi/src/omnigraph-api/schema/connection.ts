import { builder } from "@/omnigraph-api/builder";

builder.globalConnectionField("totalCount", (t) =>
  t.field({
    type: "Int",
    nullable: false,
    resolve: (parent) => parent.totalCount,
  }),
);
