import { builder } from "@/graphql-api/builder";

export const OrderDirection = builder.enumType("OrderDirection", {
  description: "Sort direction",
  values: ["ASC", "DESC"] as const,
});

export type OrderDirectionValue = typeof OrderDirection.$inferType;
