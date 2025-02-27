import { GraphiQLPage } from "@/components/graphiql/graphiql-page";
import { PageShell } from "@/components/page-shell";
import { Suspense } from "react";

export default function PonderGraphQLPage() {
  return (
    <PageShell>
      <Suspense>
        <GraphiQLPage target="ponder" />
      </Suspense>
    </PageShell>
  );
}
