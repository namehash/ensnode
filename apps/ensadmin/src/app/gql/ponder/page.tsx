import { GraphiQLEditor } from "@/components/graphiql-editor";
import { defaultEnsNodeUrl } from "@/lib/env";
import { savedQueries } from "./plugins/saved-queries";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PonderGraphQLPage({ searchParams }: PageProps) {
  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/ponder`, baseUrl).toString();

  return <GraphiQLEditor url={url} />;
  // Make this more abstract and pass plugins here so they
  // can change for subgraph/ponder APIs
  // return <GraphiQLEditor url={url} plugins={[savedQueries]} />;
}
