import { type SavedQuery, SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { defaultEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const savedQueries = [
  {
    operationName: "getDomains",
    id: "1",
    name: "Get Latest Domains",
    query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
    variables: JSON.stringify(
      {
        first: 5,
      },
      null,
      2,
    ),
  },
] satisfies Array<SavedQuery>;

export default async function SubgraphGraphQLPage({ searchParams }: PageProps) {
  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} savedQueries={savedQueries} />;
}
