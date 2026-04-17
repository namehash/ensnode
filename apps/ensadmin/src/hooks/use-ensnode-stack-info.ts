import { useIndexingStatusWithSwr } from "@/components/indexing-status";

/**
 * Use the ENSNode Stack Info for the currently selected connection.
 *
 * This is a convenience hook that abstracts away the details of
 * extracting the ENSNode Stack Info from the Indexing Status query.
 */
export function useEnsNodeStackInfo() {
  const indexingStatusSwr = useIndexingStatusWithSwr();

  return { ...indexingStatusSwr, data: indexingStatusSwr.data?.stackInfo };
}
