import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { preferredEnsNodeUrl } from "@/lib/env";
import { ClipboardIcon } from "lucide-react";

type ActionProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ActionsSubgraphCompatPage({ searchParams }: ActionProps) {
  const { ensnode = preferredEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : preferredEnsNodeUrl();

  const url = new URL(`/subgraph`, baseUrl).toString();

  return (
    <div className="flex w-full max-w-md items-center space-x-2">
      <Input type="url" placeholder="URL" disabled value={url} />
      <Button type="button" variant="ghost">
        <ClipboardIcon />
      </Button>
    </div>
  );
}
