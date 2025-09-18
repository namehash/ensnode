"use client";

import { SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { useActiveENSNodeUrl } from "@/hooks/use-active-ensnode-url";

export default function SubgraphGraphQLPage() {
  const baseUrl = useActiveENSNodeUrl();
  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} />;
}
