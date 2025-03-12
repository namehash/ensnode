import { Suspense } from "react";

import { GraphiQLPage } from "@/components/graphiql/graphiql-page";

export default function SubgraphGraphQLPage() {
  return (
    <Suspense>
      <GraphiQLPage target="subgraph" />
    </Suspense>
  );
}
