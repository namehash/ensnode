import { GraphiQLEditor } from "./graphiql-editor";
import "graphiql/graphiql.css";

export function GraphiQLPage({ target }: { target: "ponder" | "subgraph" }) {
  return <GraphiQLEditor target={target} />;
}
