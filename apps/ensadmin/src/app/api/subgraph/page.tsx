"use client";

import { SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function SubgraphGraphQLPage() {
  // TODO: we need a broader refactor to recognize the difference between
  // a selected connection being in a valid format or not.
  const { rawSelectedConnection: baseUrl } = useSelectedConnection();
  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} />;
}
