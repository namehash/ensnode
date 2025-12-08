/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import { IndexingStats } from "./indexing-stats";
import { useIndexingStatusWithSwr } from "./use-indexing-status-with-swr";

export function IndexingStatus() {
  const indexingStatusQuery = useIndexingStatusWithSwr();

  return (
    <section className="flex flex-col gap-6 p-6">
      <IndexingStats {...indexingStatusQuery} />
    </section>
  );
}
