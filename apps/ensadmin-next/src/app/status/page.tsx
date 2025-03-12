import { Suspense } from "react";

import { IndexingStatus } from "@/components/indexing-status/components";

export default function Status() {
  return (
    <Suspense>
      <IndexingStatus />
    </Suspense>
  );
}
