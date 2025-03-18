import { CopyButton } from "@/components/ui/copy-button";
import { preferredEnsNodeUrl } from "@/lib/env";

type ActionProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ActionsPonderPage({ searchParams }: ActionProps) {
  const { ensnode = preferredEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
    ? ensnode
    : preferredEnsNodeUrl();

  const url = new URL(`/ponder`, baseUrl).toString();

  return (
    <div className="flex w-full items-center space-x-2">
      <span className="font-mono text-xs select-none text-gray-500">{url}</span>
      <CopyButton value={url} message="URL copied to clipboard!" />
    </div>
  );
}
