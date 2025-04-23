import { GraphiQLPlugin, useEditorContext } from "@graphiql/react";
import { BookmarkIcon } from "lucide-react";
import React, { useCallback } from "react";

import "./saved-queries-plugin.css";

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  variables?: string;
  headers?: string;
  operationName?: string;
}

export interface SavedQueriesPluginProps {
  title?: string;
  queries: SavedQuery[];
  onQuerySelect?: (query: SavedQuery) => void;
  noQueriesMessage?: string;
}

function SavedQueriesPlugin({
  title,
  queries = [],
  onQuerySelect,
  noQueriesMessage = "No saved queries",
}: SavedQueriesPluginProps) {
  const editorContext = useEditorContext({ nonNull: true });

  const handleQueryClick = useCallback(
    (query: SavedQuery) => {
      editorContext.addTab();

      const newTabIndex = editorContext.tabs.length - 1;

      editorContext.changeTab(newTabIndex);

      editorContext.updateActiveTabValues({
        query: query.query,
        variables: query.variables || "",
        headers: query.headers || "",
        operationName: query.operationName || "",
      });

      if (query.operationName) {
        editorContext.setOperationName(query.operationName);
      }

      if (onQuerySelect) {
        onQuerySelect(query);
      }
    },
    [editorContext, onQuerySelect],
  );

  return (
    <div className="graphiql-plugin-saved-queries">
      <div className="saved-queries-header">
        <h3>{title}</h3>
      </div>
      <div className="saved-queries-list">
        {queries.length === 0 ? (
          <div className="no-queries">{noQueriesMessage}</div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className="saved-query-item"
              onClick={() => handleQueryClick(query)}
            >
              <div className="saved-query-name">{query.name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function savedQueriesPlugin({
  title = "Saved Queries",
  ...props
}: SavedQueriesPluginProps): GraphiQLPlugin {
  return {
    title,
    icon: BookmarkIcon,
    content: () => <SavedQueriesPlugin {...props} />,
  };
}
