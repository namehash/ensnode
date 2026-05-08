import { builder } from "@/omnigraph-api/builder";

export const ENSProtocolVersion = builder.enumType("ENSProtocolVersion", {
  description: "An ENS protocol version.",
  values: ["ENSv1", "ENSv2"] as const,
});
