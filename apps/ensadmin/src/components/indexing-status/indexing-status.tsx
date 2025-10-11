/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import { useIndexingStatus } from "@ensnode/ensnode-react";

import { IndexingStats } from "./indexing-stats";

export function IndexingStatus() {
  const indexingStatusQuery = useIndexingStatus();

  return (
    <section className="flex flex-col gap-6 p-6">
      <IndexingStats {...indexingStatusQuery} />
    </section>
  );
}
