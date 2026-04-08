"use client";

import type { AnyVariables, OperationContext } from "@urql/core";
import type { TadaDocumentNode } from "gql.tada";
import type { DocumentNode } from "graphql";
import { type UseQueryResponse, useQuery } from "urql";

export type UseOmnigraphQueryArgs<Data = unknown, Variables extends AnyVariables = AnyVariables> = {
  query: DocumentNode | TadaDocumentNode<Data, Variables> | string;
  variables?: Variables;
  pause?: boolean;
  context?: Partial<OperationContext>;
};

export type UseOmnigraphQueryResult<
  Data = unknown,
  Variables extends AnyVariables = AnyVariables,
> = UseQueryResponse<Data, Variables>;

export function useOmnigraphQuery<Data = unknown, Variables extends AnyVariables = AnyVariables>(
  args: UseOmnigraphQueryArgs<Data, Variables>,
): UseOmnigraphQueryResult<Data, Variables> {
  return useQuery<Data, Variables>({
    query: args.query as DocumentNode,
    variables: args.variables as Variables,
    pause: args.pause,
    context: args.context,
  });
}
