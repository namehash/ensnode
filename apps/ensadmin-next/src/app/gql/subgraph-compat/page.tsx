import { GraphiQLPage } from "@/components/graphiql/graphiql-page";
import { PageShell } from "@/components/page-shell";

export default function SubgraphGraphQLPage() {
  return (
    <PageShell>
      <GraphiQLPage target="subgraph" />
    </PageShell>
  );
}
