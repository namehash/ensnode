/** A frozen example query (matches the vendored `examples.json`). Variables are pre-resolved for that example's config namespace. */
export interface SnapshotExample {
  id: string;
  query: string;
  variables: Record<string, unknown>;
}
