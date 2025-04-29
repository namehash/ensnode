import { PonderGraphiQLEditor } from "@/components/graphiql-editor";
import { type SavedQuery } from "@/components/graphiql-editor/plugins/saved-queries";
import { defaultEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const savedQueries = [
  {
    operationName: "getLatestDomains",
    id: "1",
    name: "Get Latest Domains",
    query: `query GetLatestDomains($limit: Int!) {
  domains(orderBy: "createdAt", orderDirection: "desc", limit: $limit) {
    items {
      name
      expiryDate
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        limit: 5,
      },
      null,
      2,
    ),
  },
] satisfies Array<SavedQuery>;

export default async function PonderGraphQLPage({ searchParams }: PageProps) {
  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/ponder`, baseUrl).toString();

  return <PonderGraphiQLEditor url={url} savedQueries={savedQueries} />;
}
