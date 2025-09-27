"use client";

import { SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { useSelectedENSNodeUrl } from "@/hooks/active/use-selected-ensnode-url";

export default function SubgraphGraphQLPage() {
  const baseUrl = useSelectedENSNodeUrl();
  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} />;
}
