/** A frozen, version-locked example query (matches `versions/<version>/examples.json`). Variables are pre-resolved for the docs namespace. */
export interface SnapshotExample {
  id: string;
  query: string;
  variables: Record<string, unknown>;
}
