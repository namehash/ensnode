import { Suspense } from "react";

import "graphiql/graphiql.css";
import { GraphiQLEditor } from "./graphiql-editor";

export function GraphiQLPage({ target }: { target: "ponder" | "subgraph" }) {
  return (
    <Suspense>
      <GraphiQLEditor target={target} />
    </Suspense>
  );
}
