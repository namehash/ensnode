import { ExampleQueriesGraphiQLEditor } from "@/components/graphiql-editor";
import { defaultEnsNodeUrl } from "@/lib/env";

//TODO: this type is defined many times across multiple pages (I assume to avoid exporting) but maybe we can unify it?
type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ExampleQueryEditor({ searchParams }: PageProps) {
  const { ensnode = defaultEnsNodeUrl(), query, variables } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/subgraph`, baseUrl).toString();

  return (
    <ExampleQueriesGraphiQLEditor
      url={url}
      query={query as string}
      variables={variables && (variables as string)}
    />
  );
}
