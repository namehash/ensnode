"use client";

import { SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { useENSNodeConnection } from "@/hooks/active-ensnode-url";

export default function SubgraphGraphQLPage() {
  const baseUrl = useENSNodeConnection();
  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} />;
}
