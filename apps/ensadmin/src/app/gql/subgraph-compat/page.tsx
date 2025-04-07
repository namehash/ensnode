import { GraphiQLEditor } from "@/components/graphiql-editor";
import { parseNextJsPageSearchParams, selectedEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function SubgraphGraphQLPage({ searchParams }: PageProps) {
  const ensNodeUrl = selectedEnsNodeUrl(parseNextJsPageSearchParams(await searchParams));
  const subgraphApiUrl = new URL(`/subgraph`, ensNodeUrl);

  return <GraphiQLEditor graphQlApiUrl={subgraphApiUrl.toString()} />;
}
