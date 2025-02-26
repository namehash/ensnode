export function selectedEnsNodeUrl(params: URLSearchParams): string {
  return new URL(params.get("ensnode") || preferredEnsNodeUrl()).toString();
}

const PREFERRED_ENSNODE_URL = "https://alpha.ensnode.io";

export function preferredEnsNodeUrl(): string {
  return process.env.PREFERRED_ENSNODE_URL || PREFERRED_ENSNODE_URL;
}
