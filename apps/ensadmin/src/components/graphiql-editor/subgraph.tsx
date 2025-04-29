"use client";

import { AiQueryGeneratorForm } from "./ai-query-generator";

import { useGraphiQLEditor } from "@/components/graphiql-editor/hooks";
import { useMemo } from "react";
import { GraphiQLEditor, type GraphiQLPropsWithUrl } from "./graphiql-editor";
import { type SavedQuery, savedQueriesPlugin } from "./plugins/saved-queries";

interface SubgraphGraphiQLEditorProps
  extends Omit<GraphiQLPropsWithUrl, "plugins" | "query" | "variables"> {
  savedQueries?: Array<SavedQuery>;
}

/**
 * A GraphiQL editor for Ponder API page.
 */
export function SubgraphGraphiQLEditor(props: SubgraphGraphiQLEditorProps) {
  const graphiqlEditor = useGraphiQLEditor();

  const plugins = useMemo(
    () => [
      savedQueriesPlugin({
        queries: props.savedQueries ?? [],
        onQuerySelect: ({ query, variables }) => {
          if (variables) {
            graphiqlEditor.actions.setQueryAndVariables(query, variables);
          } else {
            graphiqlEditor.actions.setQuery(query);
          }
        },
      }),
    ],
    [props.savedQueries, graphiqlEditor.actions],
  );

  return (
    <section className="flex flex-col flex-1">
      <AiQueryGeneratorForm
        onResult={({ query, variables }) => {
          graphiqlEditor.actions.setQueryAndVariables(query, JSON.stringify(variables));
        }}
        url={props.url}
      />

      <GraphiQLEditor
        {...props}
        query={graphiqlEditor.state.query}
        variables={graphiqlEditor.state.variables}
        plugins={plugins}
      />
    </section>
  );
}
