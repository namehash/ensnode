import { defineCommand } from "citty";

import { ensnodeArgs, outputArgs } from "../../lib/args";
import { getEnsNodeClient } from "../../lib/get-ensnode-client";
import { printResult, runSafely } from "../../lib/output";
import { runOmnigraphSchema } from "./omnigraph-schema";

export const omnigraph = defineCommand({
  meta: {
    name: "omnigraph",
    description: 'Query the ENS Omnigraph GraphQL API, or explore its schema ("omnigraph schema")',
  },
  args: {
    query: {
      type: "positional",
      required: false,
      description: 'A GraphQL query string, or "schema" to explore the schema',
    },
    target: {
      type: "positional",
      required: false,
      description:
        'With "schema": a type or "Type.field" to describe (e.g. Domain or Domain.canonical)',
    },
    variables: {
      type: "string",
      description: "GraphQL variables as a JSON object string",
    },
    search: {
      type: "string",
      description: 'With "schema": list type and field names matching a keyword',
    },
    ...ensnodeArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(async () => {
      // "omnigraph schema [Type[.field]]" explores the bundled schema (no network); anything else is
      // treated as a raw GraphQL query sent to the API.
      if (args.query === "schema") {
        runOmnigraphSchema(args, typeof args.target === "string" ? args.target : undefined);
        return;
      }

      if (typeof args.query !== "string" || args.query.length === 0) {
        throw new Error(
          'Missing GraphQL query. Provide a query string, or run "enscli ensnode omnigraph schema" to explore the schema.',
        );
      }

      let variables: Record<string, unknown> = {};
      if (typeof args.variables === "string" && args.variables.length > 0) {
        try {
          variables = JSON.parse(args.variables);
        } catch {
          throw new Error("Invalid --variables: expected a JSON object string.");
        }
      }

      const client = getEnsNodeClient(args);
      const result = await client.omnigraph.query<unknown, Record<string, unknown>>({
        query: args.query,
        variables,
      });
      printResult(result, args);
    }),
});
