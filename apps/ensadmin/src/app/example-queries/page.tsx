import ExampleQueriesDocumentationLinks from "@/app/example-queries/components/ExampleQueriesDocumentationLinks";
import { defaultEnsNodeUrl } from "@/lib/env";
import React from "react";
import {ExampleQueriesContent} from "@/app/example-queries/components/ExampleQueriesContent";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

//TODO: the whole text content will probably need adjustments
//TODO: Refactor at the very end to avoid page.tsx being a 1000 lines of everything (partially done)
export default async function ExampleQueriesPage({ searchParams }: PageProps) {

  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseEnsnodeUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  return (
    <main className="h-full w-full p-6 flex flex-col flex-nowrap justify-start items-start gap-6">
      <ExampleQueriesDocumentationLinks styles="flex xl:hidden bg-gray-100 p-4 rounded-lg" />
      <header className="h-fit flex flex-col items-start justify-center">
        <h1 className="text-2xl font-semibold">Explore use cases for GraphQL queries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover, execute and modify the example queries to grasp the power of ENS
        </p>
      </header>
    <ExampleQueriesContent  ensNodeInstanceURL={baseEnsnodeUrl}/>
    </main>
  );
}
