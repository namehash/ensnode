import { useSearchParams } from "react-router";

const INSTANCE_PARAM = "instance";

export function domainNamePath(name: string): string {
  return `/domain/name/${encodeURIComponent(name)}`;
}

export function domainIdPath(id: string): string {
  return `/domain/id/${encodeURIComponent(id)}`;
}

export function accountPath(address: string): string {
  return `/account/${encodeURIComponent(address)}`;
}

export function namegraphPath(registryId: string): string {
  return `/namegraph/${encodeURIComponent(registryId)}`;
}

export function withInstanceSearch(path: string, searchParams: URLSearchParams): string {
  const instance = searchParams.get(INSTANCE_PARAM);
  if (!instance) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${INSTANCE_PARAM}=${encodeURIComponent(instance)}`;
}

export function useAppPath(): (path: string) => string {
  const [searchParams] = useSearchParams();
  return (path) => withInstanceSearch(path, searchParams);
}

export function parentDomainPath(parent: {
  id: string;
  canonical?: { name: { interpreted: string } } | null;
}): string {
  const interpreted = parent.canonical?.name.interpreted;
  if (interpreted) return domainNamePath(interpreted);
  return domainIdPath(parent.id);
}
