import { Suspense } from "react";

import { GraphiQLPage } from "@/components/graphiql/graphiql-page";

export default function PonderGraphQLPage() {
  return (
    <Suspense>
      <GraphiQLPage target="ponder" />
    </Suspense>
  );
}
