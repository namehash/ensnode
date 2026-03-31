import { trace } from "@opentelemetry/api";

export const graphqlTracer = trace.getTracer("ensnode-graphql");
