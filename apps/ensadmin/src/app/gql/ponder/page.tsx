import { GraphiQLEditor } from "@/components/graphiql-editor";
import { parseNextJsPageSearchParams, selectedEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PonderGraphQLPage({ searchParams }: PageProps) {
  const ensNodeUrl = selectedEnsNodeUrl(parseNextJsPageSearchParams(await searchParams));
  const ensNodePonderApiUrl = new URL(`/ponder`, ensNodeUrl);

  return <GraphiQLEditor graphQlApiUrl={ensNodePonderApiUrl.toString()} />;
}
