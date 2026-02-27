"use client";

import { useSearchParams } from "next/navigation";

import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

const defaultQuery = `# Welcome to this interactive playground for
# ENSNode's GraphQL API!
#
# You can get started by typing your query here or by using
# the Explorer on the left to select the data you want to query.
#
# There are also example queries in the tabs above ☝️
`;

export default function SubgraphGraphQLPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || defaultQuery;
  const initialVariables = searchParams.get("variables") || "";

  const namespace = useActiveNamespace();
  const { validatedSelectedConnection } = useSelectedConnection();

  // TODO: we need a broader refactor to recognize the difference between
  // a selected connection being in a valid format or not.
  if (!validatedSelectedConnection.isValid) {
    return (
      <div className="flex w-full max-w-md items-center space-x-2">
        <span className="font-mono text-xs select-none text-red-500">
          Invalid connection URL: {validatedSelectedConnection.error}
        </span>
      </div>
    );
  }

  const url = new URL(`/api/graphql`, validatedSelectedConnection.url).toString();

  const defaultTabs = GRAPHQL_API_EXAMPLE_QUERIES.map(({ query, variables }) => ({
    query: query.trim(),
    variables: JSON.stringify(variables[namespace] ?? variables.default),
  }));

  return (
    <GraphiQLEditor
      url={url}
      initialQuery={initialQuery}
      initialVariables={initialVariables}
      defaultTabs={defaultTabs}
    />
  );
}
