import { ReadonlyURLSearchParams } from "next/navigation";

const ACTIVE_CONNECTION_PARAM = "activeConnection";

export const getActiveConnectionFromParams = (
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): string | null => {
  return searchParams.get(ACTIVE_CONNECTION_PARAM);
};

export const setActiveConnectionInParams = (
  searchParams: URLSearchParams,
  connectionUrl: string,
): URLSearchParams => {
  const params = new URLSearchParams(searchParams);
  params.set(ACTIVE_CONNECTION_PARAM, connectionUrl);
  return params;
};

export const removeActiveConnectionFromParams = (
  searchParams: URLSearchParams,
): URLSearchParams => {
  const params = new URLSearchParams(searchParams);
  params.delete(ACTIVE_CONNECTION_PARAM);
  return params;
};

export const buildUrlWithParams = (pathname: string, searchParams: URLSearchParams): string => {
  const params = searchParams.toString();
  return params ? `${pathname}?${params}` : pathname;
};
