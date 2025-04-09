import { ensNodeMetadataQueryOptions } from "@/components/ensnode/metadata-query";
import { IndexingStatus } from "@/components/indexing-status/components";
import { getQueryClient } from "@/components/query-client";
import { parseSearchParams, selectedEnsNodeUrl } from "@/lib/env";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

interface StatusProps {
  searchParams: Promise<Record<string, unknown>>;
}

export default async function Status(props: StatusProps) {
  const ensNodeUrl = selectedEnsNodeUrl(await parseSearchParams(props.searchParams));

  const queryClient = getQueryClient();
  // wait for query data to be fetched on the server-side
  await queryClient.prefetchQuery(ensNodeMetadataQueryOptions(ensNodeUrl));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IndexingStatus />
    </HydrationBoundary>
  );
}
