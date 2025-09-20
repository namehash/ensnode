import { ReadonlyURLSearchParams } from "next/navigation";

const ACTIVE_CONNECTION_PARAM = "connection";

export const getConnectionFromParams = (
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): string | null => {
  return searchParams.get(ACTIVE_CONNECTION_PARAM);
};

export const setActiveConnectionInParams = (
  searchParams: URLSearchParams,
  connection: string,
): URLSearchParams => {
  const params = new URLSearchParams(searchParams);
  params.set(ACTIVE_CONNECTION_PARAM, connection);
  return params;
};

export const buildPathnameWithParams = (
  pathname: string,
  searchParams: URLSearchParams,
): string => {
  const params = searchParams.toString();
  return params ? `${pathname}?${params}` : pathname;
};
