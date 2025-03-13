import { GraphiQLEditor } from "@/components/graphiql-editor";
import { preferredEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PonderGraphQLPage({ searchParams }: PageProps) {
  const { ensnode = preferredEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : preferredEnsNodeUrl();

  const url = new URL(`/ponder`, baseUrl).toString();

  return <GraphiQLEditor url={url} />;
}
