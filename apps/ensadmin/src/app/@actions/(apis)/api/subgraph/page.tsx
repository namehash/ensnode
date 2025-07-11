import { CopyButton } from "@/components/ui/copy-button";
import { defaultEnsNodeUrl } from "@/lib/env";

type ActionProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ActionsSubgraphCompatPage({ searchParams }: ActionProps) {
  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/subgraph`, baseUrl).toString();

  return (
    <div className="flex w-full max-w-md items-center space-x-2">
      <span className="font-mono text-xs select-none text-gray-500">{url}</span>
      <CopyButton value={url} message="URL copied to clipboard!" />
    </div>
  );
}
