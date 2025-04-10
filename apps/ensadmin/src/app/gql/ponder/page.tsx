import { GraphiQLEditor } from "@/components/graphiql-editor";
import { parseSearchParams, selectedEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PonderGraphQLPage({ searchParams }: PageProps) {
  const ensNodeUrl = selectedEnsNodeUrl(parseSearchParams(await searchParams));
  const ensNodePonderApiUrl = new URL(`/ponder`, ensNodeUrl);

  return <GraphiQLEditor url={ensNodePonderApiUrl.toString()} />;
}
